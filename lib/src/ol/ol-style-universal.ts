/* eslint-disable @typescript-eslint/naming-convention */

import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { Optional } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';
import { fromLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';

import combine from '@turf/combine';
import cspline from 'ol-ext/render/Cspline';
import lineChunk from '@turf/line-chunk';
import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLFontSymbol from 'ol-ext/style/FontSymbol';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLGeometry from 'ol/geom/Geometry';
import OLLineString from 'ol/geom/LineString';
import OLPoint from 'ol/geom/Point';
import OLPolygon from 'ol/geom/Polygon';
import OLStroke from 'ol/style/Stroke';
import OLStrokePattern from 'ol-ext/style/StrokePattern';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 🔥 currently only works for landmarks and styles with adaptors
//    will change to work via an adadpter for most sources
//    except special cases like parcels

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleUniversalComponent)
    }
  ],
  selector: 'app-ol-style-universal',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleUniversalComponent implements OnChanges, Styler {
  @Input() contrast: 'blackOnWhite' | 'whiteOnBlack' | 'normal' = 'normal';

  @Input() fontFamily = 'Roboto';
  @Input() fontSize_huge = 32 /* 👈 pixels */;
  @Input() fontSize_large = 16 /* 👈 pixels */;
  @Input() fontSize_medium = 14 /* 👈 pixels */;
  @Input() fontSize_small = 12 /* 👈 pixels */;
  @Input() fontSize_tiny = 8 /* 👈 pixels */;
  @Input() lineChunkRatio = 5 /* 👈 size of chunk : length of text */;
  @Input() minFontPixels = 4 /* 👈 pixels */;
  @Input() overlaySelectable = false;
  @Input() showAll = false;
  @Input() showFill = false;
  @Input() showStroke = false;
  @Input() showText = false;
  @Input() strokeWidth_medium = 6 /* 👈 feet */;
  @Input() strokeWidth_thick = 9 /* 👈 feet */;
  @Input() strokeWidth_thin = 3 /* 👈 feet */;

  constructor(
    @Optional() private adaptor: AdaptorComponent,
    private decimal: DecimalPipe,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #calcFontPixels(props: LandmarkProperties, resolution: number): number {
    let fontPixels;
    if (props.fontFeet)
      fontPixels = this.#calcWidth(props.fontFeet, resolution);
    else if (props.fontPixels) fontPixels = props.fontPixels;
    else if (props.fontSize)
      fontPixels = this.#calcFontSize(
        this[`fontSize_${props.fontSize}`],
        resolution
      );
    return fontPixels;
  }

  #calcFontSize(pixels: number, resolution: number): number {
    // 👇 fontSize in pixels is proportional to resolution
    //    but no larger than the a nominal maxmimum which is for
    //    simplicity just the raw number of pixels
    return Math.min(pixels, pixels / resolution);
  }

  #calcStrokePixels(props: LandmarkProperties, resolution: number): number {
    let strokePixels;
    if (props.strokeFeet)
      strokePixels = this.#calcWidth(props.strokeFeet, resolution);
    else if (props.strokePixels) strokePixels = props.strokePixels;
    else if (props.strokeWidth)
      strokePixels = this.#calcWidth(
        this[`strokeWidth_${props.strokeWidth}`],
        resolution
      );
    return strokePixels;
  }

  #calcWidth(feet: number, resolution: number): number {
    // 👇 width in pixels is proportional to resolution in meters
    //    but no larger than the a nominal maxmimum which is for
    //    simplicity just the raw number of feet
    return Math.min(feet, feet / (resolution * 3.28084));
  }

  #chunkLine(
    feature: OLFeature<any>,
    length: number /* 👈 meters */
  ): OLFeature<any> {
    const format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
    const geojson = JSON.parse(format.writeFeature(feature));
    const chunks = lineChunk(geojson, length / 1000 /* 👈 km */);
    const multiline = combine(chunks).features[0];
    const chunked = format.readFeature(multiline);
    return chunked;
  }

  #colorOf(
    colorKey: string,
    whenHovering = false,
    whenSelected = false
  ): string {
    if (this.contrast === 'blackOnWhite') {
      if (whenHovering) colorKey = '--rgb-indigo-a700';
      else if (whenSelected) colorKey = '--rgb-red-a700';
      else colorKey = '--rgb-gray-900';
    } else if (this.contrast === 'whiteOnBlack') {
      if (whenHovering) colorKey = '--rgb-indigo-a100';
      else if (whenSelected) colorKey = '--rgb-red-a100';
      else colorKey = '--rgb-gray-50';
    }
    return this.map.vars[colorKey];
  }

  #colorOfOpposite(colorKey: string): string {
    if (this.contrast === 'whiteOnBlack') colorKey = '--rgb-gray-900';
    else if (this.contrast === 'blackOnWhite') colorKey = '--rgb-gray-50';
    return this.map.vars[colorKey];
  }

  #fillEmptyPolygon(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    _resolution: number
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    // 👇 here's the style
    const style = new OLStyle({
      fill: new OLFill({
        // 👇 polygon can be totally transparent and still be selectable
        color: [0, 0, 0, 0]
      }),
      zIndex: props.zIndex
    });
    styles.push(style);
    return styles;
  }

  #fillPolygon(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number,
    whenHovering = false,
    whenSelected = false
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (props.fillColor) {
      const fillColor = this.#colorOf(
        props.fillColor,
        whenHovering,
        whenSelected
      );
      // 🐛 FillPattern sometimes throws InvalidStateError
      let fill = new OLFill({
        color: `rgba(${fillColor}, ${props.fillOpacity})`
      });
      if (props.fillPattern) {
        try {
          fill = new OLFillPattern({
            color: `rgba(${fillColor}, ${props.fillOpacity})`,
            pattern: props.fillPattern,
            scale: props.fillPatternScale
          });
        } catch (ignored) {}
      }
      // 👇 here's the style
      const style = new OLStyle({
        fill: fill,
        geometry: props.offsetFeet
          ? this.#offsetGeometry(feature, props.offsetFeet)
          : null,
        zIndex: props.zIndex
      });
      styles.push(style);
    }
    return styles;
  }

  #measureText(text: string, font: string, resolution: number): number {
    const metrics = this.map.measureText(text, font);
    return metrics.width * resolution /* 👈 length of text in meters */;
  }

  #offsetGeometry(feature: OLFeature<any>, offsetFeet: number[]): OLGeometry {
    const offset = new OLPolygon(feature.getGeometry().getCoordinates());
    // 👉 offset is in feet, translation units are meters
    offset.translate(offsetFeet[0] / 3.28084, offsetFeet[1] / 3.28084);
    return offset;
  }

  #splineLine(feature: OLFeature<any>): OLLineString {
    return new OLLineString(
      cspline(feature.getGeometry().getCoordinates(), {
        tension: 0.5,
        pointsPerSeg: 3
      })
    );
  }

  #strokeEmptyLine(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    // 👇 here's the style
    const style = new OLStyle({
      stroke: new OLStroke({
        // 👇 line must be miniminally opaque to be selectable ??
        color: [0, 0, 0, 0.01],
        width: this.#calcStrokePixels(props, resolution)
      }),
      zIndex: props.zIndex
    });
    styles.push(style);
    return styles;
  }

  #strokeLine(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number,
    whenHovering = false,
    whenSelected = false
  ): OLStyle[] {
    return this.#strokePolygon(
      feature,
      props,
      resolution,
      whenHovering,
      whenSelected
    );
  }

  #strokePolygon(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number,
    whenHovering = false,
    whenSelected = false
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (
      props.strokeColor &&
      props.strokeStyle &&
      (props.strokeFeet || props.strokePixels || props.strokeWidth)
    ) {
      const strokeColor = this.#colorOf(
        props.strokeColor,
        whenHovering,
        whenSelected
      );
      const strokePixels = this.#calcStrokePixels(props, resolution);
      // 👇 develop the lineDash
      let lineDash;
      if (props.strokeStyle === 'dashed')
        lineDash = [
          strokePixels * props.lineDash[0],
          strokePixels * props.lineDash[1]
        ];
      else if (props.strokeStyle === 'solid') lineDash = null;
      // 🐛 StrokePattern sometimes throws InvalidStateError
      let stroke = new OLStroke({
        color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
        lineCap: 'butt',
        lineDash: lineDash,
        lineJoin: 'bevel',
        width: strokePixels
      });
      if (props.strokePattern) {
        try {
          stroke = new OLStrokePattern({
            color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
            pattern: props.strokePattern,
            scale: props.strokePatternScale,
            width: strokePixels
          });
        } catch (ignored) {}
      }
      // 👇 here's the style
      const style = new OLStyle({
        geometry: props.lineSpline
          ? this.#splineLine(feature)
          : props.offsetFeet
          ? this.#offsetGeometry(feature, props.offsetFeet)
          : null,
        stroke: stroke,
        zIndex: props.zIndex
      });
      styles.push(style);
    }
    return styles;
  }

  #styleImpl(
    feature: any,
    resolution: number,
    propss: LandmarkProperties[],
    whenHovering = false,
    whenSelected = false
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    // 👇 iterate over all the props
    propss
      .filter((props) => !!props)
      .forEach((props) => {
        if (this.map.olView.getZoom() >= (props.minZoom ?? 0)) {
          switch (feature.getGeometry().getType()) {
            case 'Point':
            case 'MultiPoint':
              if (this.showAll || this.showText || whenHovering || whenSelected)
                styles.push(
                  ...this.#textPoint(
                    feature,
                    props,
                    resolution,
                    whenHovering,
                    whenSelected
                  )
                );
              break;
            case 'LineString':
            case 'MultiLineString':
              if (this.overlaySelectable)
                styles.push(
                  ...this.#strokeEmptyLine(feature, props, resolution)
                );
              if (
                this.showAll ||
                this.showStroke ||
                whenHovering ||
                whenSelected
              )
                styles.push(
                  ...this.#strokeLine(
                    feature,
                    props,
                    resolution,
                    whenHovering,
                    whenSelected
                  )
                );
              if (this.showAll || this.showText || whenHovering || whenSelected)
                styles.push(
                  ...this.#textLine(
                    feature,
                    props,
                    resolution,
                    whenHovering,
                    whenSelected
                  )
                );
              break;
            case 'Polygon':
            case 'MultiPolygon':
              if (this.overlaySelectable)
                styles.push(
                  ...this.#fillEmptyPolygon(feature, props, resolution)
                );
              if (this.showAll || this.showFill || whenHovering || whenSelected)
                styles.push(
                  ...this.#fillPolygon(
                    feature,
                    props,
                    resolution,
                    whenHovering,
                    whenSelected
                  )
                );
              if (
                this.showAll ||
                this.showStroke ||
                whenHovering ||
                whenSelected
              )
                styles.push(
                  ...this.#strokePolygon(
                    feature,
                    props,
                    resolution,
                    whenHovering,
                    whenSelected
                  )
                );
              if (this.showAll || this.showText || whenHovering || whenSelected)
                styles.push(
                  ...this.#textPolygon(
                    feature,
                    props,
                    resolution,
                    whenHovering,
                    whenSelected
                  )
                );
              break;
          }
        }
      });
    return styles;
  }

  #textLine(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number,
    whenHovering = false,
    whenSelected = false
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (
      props.fontColor &&
      (props.fontFeet || props.fontPixels || props.fontSize) &&
      props.fontStyle &&
      props.name
    ) {
      const fontPixels = this.#calcFontPixels(props, resolution);
      // 👇 only show text if font size greater than minimum
      if (fontPixels >= this.minFontPixels) {
        const font = `${props.fontStyle} ${fontPixels}px '${this.fontFamily}'`;
        const fontColor = this.#colorOf(
          props.fontColor,
          whenHovering,
          whenSelected
        );
        const fontOutlineColor = this.#colorOfOpposite(props.fontOutlineColor);
        // 👇 we may need to chunk the text into multiple lines
        let chunked;
        if (props.lineChunk) {
          const textLength = this.#measureText(props.name, font, resolution);
          const chunkable = props.lineSpline
            ? new OLFeature({ geometry: this.#splineLine(feature) })
            : feature;
          chunked = this.#chunkLine(
            chunkable,
            textLength * this.lineChunkRatio
          );
        }
        // 👇 calculate the length if requested
        let text = props.name;
        if (props.showDimension) {
          const length = feature.getGeometry().getLength() * 3.28084;
          text += ` (${this.decimal.transform(length, '1.0-0')} ft)`;
        }
        // 👇 here's the style
        const style = new OLStyle({
          // 👇 line has already been splined above if chunked
          geometry: props.lineChunk
            ? chunked.getGeometry()
            : props.lineSpline
            ? this.#splineLine(feature)
            : null,
          text: new OLText({
            fill: new OLFill({
              color: `rgba(${fontColor}, ${props.fontOpacity})`
            }),
            font: font,
            placement: 'line',
            stroke: props.fontOutline
              ? new OLStroke({
                  color: `rgba(${fontOutlineColor}, 1)`,
                  width: fontPixels * 0.25
                })
              : null,
            text: text
          }),
          zIndex: props.zIndex
        });
        styles.push(style);
      }
    }
    return styles;
  }

  #textPoint(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number,
    whenHovering = false,
    whenSelected = false
  ): OLStyle[] {
    return this.#textPolygon(
      feature,
      props,
      resolution,
      whenHovering,
      whenSelected
    );
  }

  #textPolygon(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number,
    whenHovering = false,
    whenSelected = false
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (
      props.fontColor &&
      (props.fontFeet || props.fontPixels || props.fontSize) &&
      props.fontStyle &&
      (props.iconSymbol || props.name)
    ) {
      const fontPixels = this.#calcFontPixels(props, resolution);
      // 👇 only show text if font size greater than minimum
      if (fontPixels >= this.minFontPixels) {
        const fontColor = this.#colorOf(
          props.fontColor,
          whenHovering,
          whenSelected
        );
        const fontOutlineColor = this.#colorOfOpposite(props.fontOutlineColor);
        const iconColor = props.iconColor
          ? this.#colorOf(props.iconColor, whenHovering, whenSelected)
          : this.#colorOf(props.fontColor, whenHovering, whenSelected);
        const iconOutlineColor = this.#colorOfOpposite(props.iconOutlineColor);
        // 👇 calculate the acreage if requested
        let text = props.name?.replace(/ /g, '\n');
        if (props.showDimension) {
          const acreage = feature.getGeometry().getArea() * 0.000247105;
          text += `\n(${this.decimal.transform(acreage, '1.0-2')} ac)`;
        }
        // 👇 here's the style
        const style = new OLStyle({
          // 👇 geometry MUST be set to 'point' or else the icon won't show
          geometry: props.textLocation
            ? new OLPoint(fromLonLat(props.textLocation))
            : new OLPoint(getCenter(feature.getGeometry().getExtent())),
          image: props.iconSymbol
            ? new OLFontSymbol({
                color: `rgba(${iconColor}, ${props.iconOpacity})`,
                font: `'Font Awesome'`,
                fontStyle: 'bold',
                form: 'none',
                radius: fontPixels,
                stroke: props.iconOutline
                  ? new OLStroke({
                      // 🔥 this always shows as black!!
                      color: `rgba(${iconOutlineColor}, 1)`,
                      width: fontPixels * 0.1
                    })
                  : null,
                text: props.iconSymbol
              })
            : null,
          text: props.name
            ? new OLText({
                fill: new OLFill({
                  color: `rgba(${fontColor}, ${props.fontOpacity})`
                }),
                font: `${props.fontStyle} ${fontPixels}px '${this.fontFamily}'`,
                offsetY: props.iconSymbol ? -fontPixels : 0,
                overflow: true,
                stroke: props.fontOutline
                  ? new OLStroke({
                      color: `rgba(${fontOutlineColor}, 1)`,
                      width: fontPixels * 0.25
                    })
                  : null,
                text: text,
                textAlign: props.textAlign,
                textBaseline: props.textBaseline
              })
            : null,
          zIndex: props.zIndex
        });
        styles.push(style);
      }
    }
    return styles;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      const propss = (this.adaptor as Adaptor).adapt(feature.getProperties());
      const styles = this.#styleImpl(feature, resolution, propss);
      // 👉 add any backdoor styles
      if ((this.adaptor as Adaptor)?.backdoor)
        styles.push(...(this.adaptor as Adaptor).backdoor(feature, resolution));
      return styles;
    };
  }

  styleWhenHovering(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      if ((this.adaptor as Adaptor)?.adaptWhenHovering) {
        const propss = (this.adaptor as Adaptor).adaptWhenHovering(
          feature.getProperties()
        );
        return this.#styleImpl(feature, resolution, propss, true, false);
      } else return [];
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      if ((this.adaptor as Adaptor)?.adaptWhenSelected) {
        const propss = (this.adaptor as Adaptor).adaptWhenSelected(
          feature.getProperties()
        );
        return this.#styleImpl(feature, resolution, propss, false, true);
      } else return [];
    };
  }
}
