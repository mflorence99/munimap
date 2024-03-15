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
import { SimpleChanges } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { convertArea } from '@turf/helpers';
import { convertLength } from '@turf/helpers';
import { forwardRef } from '@angular/core';
import { fromLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';
import { inject } from '@angular/core';

import area from '@turf/area';
import combine from '@turf/combine';
import cspline from 'ol-ext/render/Cspline';
import length from '@turf/length';
import lineChunk from '@turf/line-chunk';
import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLFontSymbol from 'ol-ext/style/FontSymbol';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLLineString from 'ol/geom/LineString';
import OLPoint from 'ol/geom/Point';
import OLPolygon from 'ol/geom/Polygon';
import OLStroke from 'ol/style/Stroke';
import OLStrokePattern from 'ol-ext/style/StrokePattern';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

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

  /* eslint-disable @typescript-eslint/naming-convention */

  @Input() fontFamily = 'Roboto';
  @Input() fontOutlineRatio = 0.1 /* 👈 outline width : fontSize */;
  @Input() fontSize_huge = 32 /* 👈 pixels */;
  @Input() fontSize_large = 16 /* 👈 pixels */;
  @Input() fontSize_medium = 12 /* 👈 pixels */;
  @Input() fontSize_small = 12 /* 👈 pixels */;
  @Input() fontSize_tiny = 8 /* 👈 pixels */;
  @Input() iconOutlineRatio = 0.1 /* 👈 outline width : fontSize */;
  @Input() lineCap: CanvasLineCap = 'butt';
  @Input() lineChunkRatio = 5 /* 👈 size of chunk : length of text */;
  @Input() lineJoin: CanvasLineJoin = 'bevel';
  @Input() maxFontPixels = 32 /* 👈 pixels */;
  @Input() minFontPixels = 6 /* 👈 pixels */;
  @Input() overlaySelectable = false;
  @Input() showAll = false;
  @Input() showFill = false;
  @Input() showStroke = false;
  @Input() showText = false;
  @Input() strokeOutlineRatio = 0.1 /* 👈 outline width : strokeWidth */;
  @Input() strokeWidth_medium = 6 /* 👈 feet */;
  @Input() strokeWidth_thick = 9 /* 👈 feet */;
  @Input() strokeWidth_thin = 3 /* 👈 feet */;

  /* eslint-enable @typescript-eslint/naming-convention */

  #adaptor = inject(AdaptorComponent, { optional: true });
  #decimal = inject(DecimalPipe);
  #format: OLGeoJSON;
  #layer = inject(OLLayerVectorComponent);
  #map = inject(OLMapComponent);

  constructor() {
    this.#format = new OLGeoJSON({
      dataProjection: this.#map.featureProjection,
      featureProjection: this.#map.projection
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.#layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      const propss = (this.#adaptor as Adaptor).adapt(feature.getProperties());
      const styles = this.#styleImpl(feature, resolution, propss);
      // 👉 add any backdoor styles
      if ((this.#adaptor as Adaptor)?.backdoor)
        styles.push(
          ...(this.#adaptor as Adaptor).backdoor(feature, resolution)
        );
      return styles;
    };
  }

  styleWhenHovering(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      if ((this.#adaptor as Adaptor)?.adaptWhenHovering) {
        const propss = (this.#adaptor as Adaptor).adaptWhenHovering(
          feature.getProperties()
        );
        const whenHovering = true;
        const whenSelected = false;
        return this.#styleImpl(
          feature,
          resolution,
          propss,
          whenHovering,
          whenSelected
        );
      } else return [];
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      if ((this.#adaptor as Adaptor)?.adaptWhenSelected) {
        const propss = (this.#adaptor as Adaptor).adaptWhenSelected(
          feature.getProperties()
        );
        const whenHovering = false;
        const whenSelected = true;
        return this.#styleImpl(
          feature,
          resolution,
          propss,
          whenHovering,
          whenSelected
        );
      } else return [];
    };
  }

  #calcFontPixels(props: LandmarkProperties, resolution: number): number {
    let fontPixels;
    if (props.fontFeet)
      fontPixels = this.#calcPixelsForFeet(props.fontFeet, resolution);
    else if (props.fontPixels)
      fontPixels = this.#map.numPixels(props.fontPixels);
    else if (props.fontSize)
      fontPixels = this[`fontSize_${props.fontSize}`] / Math.sqrt(resolution);
    return Math.min(this.maxFontPixels, fontPixels);
  }

  #calcPixelsForFeet(feet: number, resolution: number): number {
    // 👇 resolution is meters per pixel
    return feet / convertLength(resolution, 'meters', 'feet');
  }

  #calcStrokePixels(props: LandmarkProperties, resolution: number): number {
    let strokePixels;
    if (props.strokeFeet)
      strokePixels = this.#calcPixelsForFeet(props.strokeFeet, resolution);
    else if (props.strokePixels)
      strokePixels = this.#map.numPixels(props.strokePixels);
    else if (props.strokeWidth)
      strokePixels = this.#calcPixelsForFeet(
        this[`strokeWidth_${props.strokeWidth}`],
        resolution
      );
    return strokePixels;
  }

  #chunkLine(feature: OLFeature<any>, length: number /* 👈 meters */): any {
    const geojson = JSON.parse(this.#format.writeFeature(feature));
    const chunks = lineChunk(geojson, length / 1000 /* 👈 km */);
    const multiline = combine(chunks).features[0];
    const chunked = this.#format.readFeature(multiline);
    return chunked;
  }

  #colorOf(
    colorKey: string,
    whenHovering = false,
    whenSelected = false,
    whenRedrawing = false
  ): string {
    if (this.contrast === 'blackOnWhite') {
      if (whenHovering) colorKey = '--rgb-indigo-a700';
      else if (whenRedrawing) colorKey = '--rgb-blue-a200';
      else if (whenSelected) colorKey = '--rgb-red-a700';
      else colorKey = '--rgb-gray-900';
    } else if (this.contrast === 'whiteOnBlack') {
      if (whenHovering) colorKey = '--rgb-indigo-a100';
      else if (whenRedrawing) colorKey = '--rgb-blue-a200';
      else if (whenSelected) colorKey = '--rgb-red-a100';
      else colorKey = '--rgb-gray-50';
    } else if (this.contrast === 'normal') {
      if (whenRedrawing) colorKey = '--rgb-blue-a200';
    }
    return this.#map.vars[colorKey];
  }

  #colorOfOpposite(colorKey: string): string {
    if (this.contrast === 'whiteOnBlack') colorKey = '--rgb-gray-900';
    else if (this.contrast === 'blackOnWhite') colorKey = '--rgb-gray-50';
    return this.#map.vars[colorKey];
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
      let style = new OLStyle({
        fill: new OLFill({
          color: `rgba(${fillColor}, ${props.fillOpacity})`
        }),
        zIndex: props.zIndex
      });
      if (props.fillPattern) {
        if (props.fillPatternAndColor) styles.push(style);
        try {
          style = new OLStyle({
            fill: new OLFillPattern({
              color: `rgba(${fillColor}, ${
                props.fillPatternAndColor ? 1 : props.fillOpacity
              })`,
              pattern: props.fillPattern,
              scale: props.fillPatternScale
            }),
            zIndex: props.zIndex
          });
        } finally {
          styles.push(style);
        }
      } else styles.push(style);
      // 👇 here's the shadow style
      if (props.shadowColor && props.shadowOffsetFeet && props.shadowOpacity) {
        const shadowColor = this.#colorOf(
          props.shadowColor,
          whenHovering,
          whenSelected
        );
        const shadowLocation = new OLPolygon(
          feature.getGeometry().getCoordinates()
        );
        // 👉 offset is in feet, translation units are meters
        shadowLocation.translate(
          this.#translationOffset(props.shadowOffsetFeet[0]),
          this.#translationOffset(props.shadowOffsetFeet[1])
        );
        const shadow = new OLStyle({
          fill: new OLFill({
            color: `rgba(${shadowColor}, ${props.shadowOpacity})`
          }),
          geometry: shadowLocation,
          zIndex: props.zIndex - 1
        });
        styles.push(shadow);
      }
    }
    return styles;
  }

  #measureText(text: string, font: string, resolution: number): number {
    const metrics = this.#map.measureText(text, font);
    return metrics.width * resolution /* 👈 length of text in meters */;
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
      // 🔥 pretty hack back door -- see ol-interaction-redraw*
      const whenRedrawing = feature.get('ol-interaction-redraw');
      const strokeColor = this.#colorOf(
        props.strokeColor,
        whenHovering,
        whenSelected,
        whenRedrawing
      );
      const strokeOutlineColor = this.#colorOf(
        props.strokeOutlineColor,
        whenHovering,
        whenSelected,
        whenRedrawing
      );
      let strokePixels = this.#calcStrokePixels(props, resolution);
      // 👇 if we're drawing a stroke outline, we first stroke
      //    full width of the outline, then reduce the width for
      //    the interior
      if (props.strokeOutline && props.strokeOutlineColor) {
        let style = new OLStyle({
          stroke: new OLStroke({
            color: `rgba(${strokeOutlineColor}, 1)`,
            lineCap: this.lineCap,
            lineJoin: this.lineJoin,
            width: strokePixels
          }),
          zIndex: props.zIndex - 2
        });
        styles.push(style);
        strokePixels = strokePixels * (1 - this.strokeOutlineRatio);
        if (props.strokePattern) {
          style = new OLStyle({
            stroke: new OLStroke({
              color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
              lineCap: this.lineCap,
              lineJoin: this.lineJoin,
              width: strokePixels
            }),
            zIndex: props.zIndex - 1
          });
          styles.push(style);
        }
      }
      // 👇 develop the lineDash
      let lineDash = null;
      if (props.strokeStyle === 'dashed' && props.lineDash)
        lineDash = [
          strokePixels * props.lineDash[0],
          strokePixels * props.lineDash[1]
        ];
      // 🐛 StrokePattern sometimes throws InvalidStateError
      let stroke = new OLStroke({
        color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
        lineCap: this.lineCap,
        lineDash: lineDash,
        lineJoin: this.lineJoin,
        width: strokePixels
      });
      if (props.strokePattern) {
        try {
          stroke = new OLStrokePattern({
            color: `rgba(${
              props.strokeOutline ? strokeOutlineColor : strokeColor
            }, ${props.strokeOpacity})`,
            pattern: props.strokePattern as any,
            scale: props.strokePatternScale
          });
        } catch (ignored) {}
      }
      // 👇 here's the style
      const style = new OLStyle({
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
        if (this.#map.olView.getZoom() >= (props.minZoom ?? 0)) {
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
      (props.name || props.showDimension)
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
        const dfltOutlineColor = '--rgb-gray-50';
        const fontOutlineColor = this.#colorOfOpposite(
          props.fontOutlineColor ?? dfltOutlineColor
        );
        // 👇 calculate the length if requested
        let text = props.name ?? '';
        if (props.showDimension) {
          // 👀 https://gis.stackexchange.com/questions/142062/openlayers-3-linestring-getlength-not-returning-expected-value
          const geojson = JSON.parse(this.#format.writeFeature(feature));
          text += ` (${this.#decimal.transform(
            length(geojson, { units: 'feet' }),
            '1.0-0'
          )} ft)`;
        }
        // 👇 we may need to chunk the text into multiple lines
        let chunked;
        if (props.lineChunk) {
          const textLength = this.#measureText(text, font, resolution);
          const chunkable = props.lineSpline
            ? new OLFeature({ geometry: this.#splineLine(feature) })
            : feature;
          chunked = this.#chunkLine(
            chunkable,
            textLength * this.lineChunkRatio
          );
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
      (props.fontColor || props.iconColor) &&
      (props.fontFeet || props.fontPixels || props.fontSize) &&
      props.fontStyle &&
      (props.iconSymbol || props.name || props.showDimension)
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
        const dfltOutlineColor = '--rgb-gray-50';
        const fontOutlineColor = this.#colorOfOpposite(
          props.fontOutlineColor ?? dfltOutlineColor
        );
        const iconColor = props.iconColor
          ? this.#colorOf(props.iconColor, whenHovering, whenSelected)
          : this.#colorOf(props.fontColor, whenHovering, whenSelected);
        const iconOutlineColor = this.#colorOfOpposite(
          props.iconOutlineColor ?? dfltOutlineColor
        );
        // 👇 calculate the acreage if requested
        let text = props.name?.replace(/ /g, '\n') ?? '';
        if (props.showDimension) {
          // 👀 https://gis.stackexchange.com/questions/142062/openlayers-3-linestring-getlength-not-returning-expected-value
          const geojson = JSON.parse(this.#format.writeFeature(feature));
          text += `\n(${this.#decimal.transform(
            convertArea(area(geojson), 'meters', 'acres'),
            '1.0-2'
          )} ac)`;
        }
        // 👇 establish the location of the text
        let textLocation;
        if (props.textLocation)
          textLocation = new OLPoint(fromLonLat(props.textLocation));
        else {
          textLocation = new OLPoint(
            getCenter(feature.getGeometry().getExtent())
          );
          // 👉 offset is in feet, translation units are meters
          if (props.textOffsetFeet)
            textLocation.translate(
              this.#translationOffset(props.textOffsetFeet[0]),
              this.#translationOffset(props.textOffsetFeet[1])
            );
        }
        // 👇 will the text rotate?
        let textRotate = props.textRotate;
        if (textRotate) {
          const longest = text
            .split('\n')
            .sort((a, b) => b.length - a.length)[0];
          const textLength = this.#measureText(longest, font, resolution);
          // 👉 textLength is in meters, minWidth in feet
          if (convertLength(textLength, 'meters', 'feet') < props.minWidth)
            textRotate = false;
        }
        // 👇 here's the style
        const style = new OLStyle({
          // 👇 geometry MUST be set to 'point' or else the icon won't show
          geometry: textLocation,
          image: props.iconSymbol
            ? new OLFontSymbol({
                color: `rgba(${iconColor}, ${props.iconOpacity})`,
                fill: new OLFill({ color: `rgba(${iconOutlineColor}, 1)` }),
                font: `'Font Awesome'`,
                fontStyle: 'bold',
                form: 'none',
                radius: fontPixels,
                stroke: props.iconOutline
                  ? new OLStroke({
                      color: `rgba(${iconOutlineColor}, 1)`,
                      width: fontPixels * this.fontOutlineRatio
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
                font: font,
                offsetY: props.iconSymbol ? -fontPixels : 0,
                overflow: true,
                rotation: textRotate ? props.orientation * (Math.PI / 180) : 0,
                stroke: props.fontOutline
                  ? new OLStroke({
                      color: `rgba(${fontOutlineColor}, 1)`,
                      width: fontPixels * this.iconOutlineRatio
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

  #translationOffset(feet: number): number {
    const negative = feet < 0;
    const meters = convertLength(Math.abs(feet), 'feet', 'meters');
    return meters * (negative ? -1 : +1);
  }
}
