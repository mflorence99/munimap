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
import OLLineString from 'ol/geom/LineString';
import OLPoint from 'ol/geom/Point';
import OLStroke from 'ol/style/Stroke';
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
  @Input() minFontSize = 4 /* 👈 pixels */;
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
    if (props.fillColor && props.fillOpacity > 0) {
      const fillColor = this.map.vars[props.fillColor];
      // 🐛 FillPattern sometimes throws InvalidStateError
      let fill = new OLFill({
        color: `rgba(${fillColor}, ${props.fillOpacity})`
      });
      if (props.fillPattern) {
        try {
          fill = new OLFillPattern({
            color: `rgba(${fillColor}, ${props.fillOpacity})`,
            pattern: props.fillPattern
          });
        } catch (ignored) {}
      }
      styles.push(new OLStyle({ fill, zIndex: props.zIndex }));
    }
    return styles;
  }

  #fontSize(pixels: number, resolution: number): number {
    // 👇 fontSize in pixels is proportional to resolution
    //    but no larger than the a nominal maxmimum which is for
    //    simplicity just the raw number of pixels
    return Math.min(pixels, pixels / resolution);
  }

  #lineSpline(
    feature: OLFeature<any>,
    props: LandmarkProperties
  ): OLLineString {
    return props.lineSpline
      ? new OLLineString(
          cspline(feature.getGeometry().getCoordinates(), {
            tension: 0.5,
            pointsPerSeg: 3
          })
        )
      : null;
  }

  #measureText(text: string, font: string, resolution: number): number {
    const metrics = this.map.measureText(text, font);
    return metrics.width * resolution /* 👈 length of text i  meters */;
  }

  #strokeLine(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number
  ): OLStyle[] {
    return this.#strokePolygon(feature, props, resolution);
  }

  #strokePolygon(
    feature: OLFeature<any>,
    props: LandmarkProperties,
    resolution: number
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (
      props.strokeColor &&
      props.strokeOpacity > 0 &&
      props.strokeStyle &&
      (props.strokeFeet || props.strokePixels || props.strokeWidth)
    ) {
      const strokeColor = this.map.vars[props.strokeColor];
      // 👇 find the stroke width in pixels
      let strokePixels;
      if (props.strokeFeet)
        strokePixels = this.#width(props.strokeFeet, resolution);
      else if (props.strokePixels) strokePixels = props.strokePixels;
      else if (props.strokeWidth)
        strokePixels = this.#width(
          this[`strokeWidth_${props.strokeWidth}`],
          resolution
        );
      // 👇 develop the lineDash
      let lineDash;
      if (props.strokeStyle === 'dashed')
        lineDash = [
          strokePixels * props.lineDash[0],
          strokePixels * props.lineDash[1]
        ];
      else if (props.strokeStyle === 'solid') lineDash = null;
      // 👇 here's the stroke
      const stroke = new OLStyle({
        geometry: this.#lineSpline(feature, props),
        stroke: new OLStroke({
          color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
          lineCap: 'butt',
          lineDash: lineDash,
          lineJoin: 'bevel',
          width: strokePixels
        }),
        zIndex: props.zIndex
      });
      styles.push(stroke);
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
      props.fontOpacity > 0 &&
      props.fontSize &&
      props.fontStyle &&
      props.name
    ) {
      // 👇 find the font size in pixels
      const fontSize = this.#fontSize(
        this[`fontSize_${props.fontSize}`],
        resolution
      );
      // 👇 only show text if font size greater than minimum
      if (fontSize >= this.minFontSize) {
        const font = `${props.fontStyle} ${fontSize}px '${this.fontFamily}'`;
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
        const name = new OLStyle({
          geometry: this.#lineSpline(feature, props),
          text: new OLText({
            fill: new OLFill({
              color: `rgba(${fontColor}, ${props.fontOpacity})`
            }),
            font: font,
            placement: 'line',
            stroke: props.fontOutline
              ? new OLStroke({
                  color: `rgba(255, 255, 255, 1)`,
                  width: fontSize * 0.25
                })
              : null,
            text: props.name
          }),
          zIndex: props.zIndex
        });
        styles.push(name);
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
      (props.fontColor &&
        props.fontOpacity > 0 &&
        props.fontSize &&
        props.fontStyle &&
        props.textIcon) ||
      props.name
    ) {
      const fontSize = this.#fontSize(
        this[`fontSize_${props.fontSize}`],
        resolution
      );
      // 👇 only show text if font size greater than minimum
      if (fontSize >= this.minFontSize) {
        const fontColor = this.map.vars[props.fontColor];
        let text = props.name?.replace(/ /g, '\n');
        // 👇 calculate the acreage if requested
        if (props.textShowAcreage) {
          const acreage = feature.getGeometry().getArea() * 0.000247105;
          text += `\n(${this.decimal.transform(acreage, '1.0-2')} ac)`;
        }
        // 👇 finally build the complete style
        const style = new OLStyle({
          geometry: props.fillCenter
            ? new OLPoint(fromLonLat(props.fillCenter))
            : null,
          image: props.textIcon
            ? new OLFontSymbol({
                color: `rgba(${fontColor}, ${props.fontOpacity})`,
                font: `'Font Awesome'`,
                fontStyle: 'bold',
                form: 'none',
                radius: fontSize,
                text: props.textIcon
              })
            : null,
          text: props.name
            ? new OLText({
                fill: new OLFill({
                  color: `rgba(${fontColor}, ${props.fontOpacity})`
                }),
                font: `${props.fontStyle} ${fontSize}px '${this.fontFamily}'`,
                offsetY: props.textIcon ? -fontSize * 1.5 : 0,
                overflow: true,
                stroke: props.fontOutline
                  ? new OLStroke({
                      color: `rgba(255, 255, 255, 1)`,
                      width: fontSize * 0.25
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
      const styles: OLStyle[] = [];
      // 🔥 TEMPORARY -- we will REQUIRE an adptor soon
      const propss = this.adaptor
        ? (this.adaptor as Adaptor).adapt(feature.getProperties())
        : [feature.getProperties() as LandmarkProperties];
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
    };
  }
}
