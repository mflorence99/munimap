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

import cspline from 'ol-ext/render/Cspline';
import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLFontSymbol from 'ol-ext/style/FontSymbol';
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
  @Input() fontFamily = 'Roboto';
  @Input() fontSize_large = 16 /* 👈 pixels */;
  @Input() fontSize_medium = 14 /* 👈 pixels */;
  @Input() fontSize_small = 12 /* 👈 pixels */;
  @Input() minFontPixels = 4 /* 👈 pixels */;
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

  #fillPolygon(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    _resolution: number
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (props.fillColor) {
      const fillColor = this.map.vars[props.fillColor];
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
      // 👇 here's the syle
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

  #fontPixels(props: LandmarkProperties, resolution: number): number {
    let fontPixels;
    if (props.fontFeet) fontPixels = this.#width(props.fontFeet, resolution);
    else if (props.fontPixels) fontPixels = props.fontPixels;
    else if (props.fontSize)
      fontPixels = this.#fontSize(
        this[`fontSize_${props.fontSize}`],
        resolution
      );
    return fontPixels;
  }

  #fontSize(pixels: number, resolution: number): number {
    // 👇 fontSize in pixels is proportional to resolution
    //    but no larger than the a nominal maxmimum which is for
    //    simplicity just the raw number of pixels
    return Math.min(pixels, pixels / resolution);
  }

  #lineSpline(feature: OLFeature<any>): OLLineString {
    return new OLLineString(
      cspline(feature.getGeometry().getCoordinates(), {
        tension: 0.5,
        pointsPerSeg: 3
      })
    );
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

  #strokeLine(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number
  ): OLStyle[] {
    return this.#strokePolygon(feature, props, resolution);
  }

  #strokePixels(props: LandmarkProperties, resolution: number): number {
    let strokePixels;
    if (props.strokeFeet)
      strokePixels = this.#width(props.strokeFeet, resolution);
    else if (props.strokePixels) strokePixels = props.strokePixels;
    else if (props.strokeWidth)
      strokePixels = this.#width(
        this[`strokeWidth_${props.strokeWidth}`],
        resolution
      );
    return strokePixels;
  }

  #strokePolygon(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (
      props.strokeColor &&
      props.strokeStyle &&
      (props.strokeFeet || props.strokePixels || props.strokeWidth)
    ) {
      const strokeColor = this.map.vars[props.strokeColor];
      const strokePixels = this.#strokePixels(props, resolution);
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
          ? this.#lineSpline(feature)
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
    propss: LandmarkProperties[]
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    // 👇 iterate over all the props
    for (const props of propss) {
      if (this.map.olView.getZoom() >= (props.minZoom ?? 0)) {
        switch (feature.getGeometry().getType()) {
          case 'Point':
          case 'MultiPoint':
            if (this.showAll || this.showText)
              styles.push(...this.#textPoint(feature, props, resolution));
            break;
          case 'LineString':
          case 'MultiLineString':
            if (this.showAll || this.showStroke)
              styles.push(...this.#strokeLine(feature, props, resolution));
            if (this.showAll || this.showText)
              styles.push(...this.#textLine(feature, props, resolution));
            break;
          case 'Polygon':
          case 'MultiPolygon':
            if (this.showAll || this.showFill)
              styles.push(...this.#fillPolygon(feature, props, resolution));
            if (this.showAll || this.showStroke)
              styles.push(...this.#strokePolygon(feature, props, resolution));
            if (this.showAll || this.showText)
              styles.push(...this.#textPolygon(feature, props, resolution));
            break;
        }
      }
    }
    return styles;
  }

  #textLine(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (
      props.fontColor &&
      (props.fontFeet || props.fontPixels || props.fontSize) &&
      props.fontStyle &&
      props.name
    ) {
      const fontPixels = this.#fontPixels(props, resolution);
      // 👇 only show text if font size greater than minimum
      if (fontPixels >= this.minFontPixels) {
        const font = `${props.fontStyle} ${fontPixels}px '${this.fontFamily}'`;
        // 🔥 TEMPORARY -- we may need to chunk the text into multiple lines
        console.log(
          `${props.name} length: ${this.#measureText(
            props.name,
            font,
            resolution
          )} meters`
        );
        // 🔥 back to our normal programming
        const fontColor = this.map.vars[props.fontColor];
        const fontOutlineColor = this.map.vars[props.fontOutlineColor];
        // 👇 here's the style
        const style = new OLStyle({
          geometry: props.lineSpline ? this.#lineSpline(feature) : null,
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
            text: props.name
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
    resolution: number
  ): OLStyle[] {
    return this.#textPolygon(feature, props, resolution);
  }

  #textPolygon(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (
      props.fontColor &&
      (props.fontFeet || props.fontPixels || props.fontSize) &&
      props.fontStyle &&
      (props.iconSymbol || props.name)
    ) {
      const fontPixels = this.#fontPixels(props, resolution);
      // 👇 only show text if font size greater than minimum
      if (fontPixels >= this.minFontPixels) {
        const fontColor = this.map.vars[props.fontColor];
        const fontOutlineColor = this.map.vars[props.fontOutlineColor];
        const iconColor = props.iconColor
          ? this.map.vars[props.iconColor]
          : this.map.vars[props.fontColor];
        const iconOutlineColor = this.map.vars[props.iconOutlineColor];
        let text = props.name?.replace(/ /g, '\n');
        // 👇 calculate the acreage if requested
        if (props.showAcreage) {
          const acreage = feature.getGeometry().getArea() * 0.000247105;
          text += `\n(${this.decimal.transform(acreage, '1.0-2')} ac)`;
        }
        // 👇 here's the style
        const style = new OLStyle({
          geometry: props.fillCenter
            ? new OLPoint(fromLonLat(props.fillCenter))
            : null,
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
                offsetY: props.iconSymbol ? -fontPixels * 1.5 : 0,
                overflow: true,
                stroke: props.fontOutline
                  ? new OLStroke({
                      color: `rgba(${fontOutlineColor}, 1)`,
                      width: fontPixels * 0.25
                    })
                  : null,
                text: text
              })
            : null,
          zIndex: props.zIndex
        });
        styles.push(style);
      }
    }
    return styles;
  }

  #width(feet: number, resolution: number): number {
    // 👇 width in pixels is proportional to resolution in meters
    //    but no larger than the a nominal maxmimum which is for
    //    simplicity just the raw number of feet
    return Math.min(feet, feet / (resolution * 3.28084));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      // 🔥 TEMPORARY -- we will REQUIRE an adaptor soon
      const propss = this.adaptor
        ? (this.adaptor as Adaptor).adapt(feature.getProperties())
        : [feature.getProperties() as LandmarkProperties];
      return this.#styleImpl(feature, resolution, propss);
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      if ((this.adaptor as Adaptor)?.adaptWhenSelected) {
        const propss = (this.adaptor as Adaptor).adaptWhenSelected(
          feature.getProperties()
        );
        return this.#styleImpl(feature, resolution, propss);
      } else return [];
    };
  }
}
