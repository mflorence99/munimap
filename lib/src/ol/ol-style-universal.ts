/* eslint-disable @typescript-eslint/naming-convention */

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

import { forwardRef } from '@angular/core';
import { fromLonLat } from 'ol/proj';

import cspline from 'ol-ext/render/Cspline';
import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLFontSymbol from 'ol-ext/style/FontSymbol';
import OLGeometry from 'ol/geom/Geometry';
import OLLineString from 'ol/geom/LineString';
import OLPoint from 'ol/geom/Point';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 🔥 currently only works for landmarks
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
  @Input() fontSize_medium = 13 /* 👈 pixels */;
  @Input() fontSize_small = 10 /* 👈 pixels */;
  @Input() minFontSize = 4 /* 👈 pixels */;
  @Input() showFill = false;
  @Input() showStroke = false;
  @Input() showText = false;
  @Input() strokeWidth_medium = 6 /* 👈 feet */;
  @Input() strokeWidth_thick = 9 /* 👈 feet */;
  @Input() strokeWidth_thin = 3 /* 👈 feet */;

  constructor(
    private decimal: DecimalPipe,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #fillPolygon(landmark: any, _resolution: number): OLStyle[] {
    const props = landmark.getProperties() as LandmarkProperties;
    const styles: OLStyle[] = [];
    if (props.fillColor && props.fillOpacity > 0) {
      const fillColor = this.map.vars[props.fillColor];
      const fill = new OLStyle({
        fill: props.fillPattern
          ? // 👉 fill with pattern
            new OLFillPattern({
              color: `rgba(${fillColor}, ${props.fillOpacity})`,
              pattern: props.fillPattern
            })
          : // 👉 fill with color
            new OLFill({
              color: `rgba(${fillColor}, ${props.fillOpacity})`
            }),
        zIndex: props.zIndex
      });
      styles.push(fill);
    }
    return styles;
  }

  #fontSize(pixels: number, resolution: number): number {
    // 👇 fontSize in pixels is proportional to resolution
    //    but no larger than the a nominal maxmimum which is for
    //    simplicity just the raw number of pixels
    return Math.min(pixels, pixels / resolution);
  }

  #strokeLine(landmark: any, resolution: number): OLStyle[] {
    const props = landmark.getProperties() as LandmarkProperties;
    // 👇 we may need to create a spline stroke
    const geometry = props.lineSpline
      ? new OLLineString(
          cspline(landmark.getGeometry().getCoordinates(), {
            tension: 0.5,
            pointsPerSeg: 3
          })
        )
      : null;
    return this.#strokePolygon(landmark, resolution, geometry);
  }

  #strokePolygon(
    landmark: any,
    resolution: number,
    geometry: OLGeometry = null
  ): OLStyle[] {
    const props = landmark.getProperties() as LandmarkProperties;
    const styles: OLStyle[] = [];
    if (
      props.strokeColor &&
      props.strokeOpacity > 0 &&
      props.strokeStyle &&
      props.strokeWidth
    ) {
      const strokeColor = this.map.vars[props.strokeColor];
      const strokePixels = this.#width(
        isNaN(props.strokeWidth as any)
          ? this[`strokeWidth_${props.strokeWidth}`]
          : props.strokeWidth,
        resolution
      );
      // 👇 a solid stroke is simple
      if (props.strokeStyle === 'solid') {
        const stroke = new OLStyle({
          geometry: geometry,
          stroke: new OLStroke({
            color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
            width: strokePixels
          }),
          zIndex: props.zIndex
        });
        styles.push(stroke);
      }
      // 👇 dashed strokes are a bit more complicated
      else if (props.strokeStyle === 'dashed') {
        const white = new OLStyle({
          geometry: geometry,
          stroke: new OLStroke({
            color: `rgba(255, 255, 255, ${props.strokeOpacity})`,
            width: strokePixels
          })
        });
        const dashed = new OLStyle({
          geometry: geometry,
          stroke: new OLStroke({
            color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
            lineCap: 'square',
            lineDash:
              strokePixels > 1
                ? [strokePixels, strokePixels * 2]
                : [strokePixels * 2, strokePixels],
            lineJoin: 'bevel',
            width: strokePixels
          }),
          zIndex: props.zIndex
        });
        styles.push(white, dashed);
      }
    }
    return styles;
  }

  #textLine(landmark: any, resolution: number): OLStyle[] {
    const props = landmark.getProperties() as LandmarkProperties;
    const styles: OLStyle[] = [];
    if (
      props.fontColor &&
      props.fontOpacity > 0 &&
      props.fontSize &&
      props.fontStyle &&
      props.name
    ) {
      const fontSize = this.#fontSize(
        this[`fontSize_${props.fontSize}`],
        resolution
      );
      // 👇 only show text if font size greater than minimum
      if (fontSize >= this.minFontSize) {
        const fontColor = this.map.vars[props.fontColor];
        const name = new OLStyle({
          text: new OLText({
            fill: new OLFill({
              color: `rgba(${fontColor}, ${props.fontOpacity})`
            }),
            font: `${props.fontStyle} ${fontSize}px '${this.fontFamily}'`,
            placement: 'line',
            stroke: props.fontOutline
              ? new OLStroke({
                  color: `rgba(255, 255, 255, 1)`,
                  width: fontSize * 0.25
                })
              : null,
            text: props.name
          })
        });
        styles.push(name);
      }
    }
    return styles;
  }

  #textPoint(landmark: any, resolution: number): OLStyle[] {
    return this.#textPolygon(landmark, resolution);
  }

  #textPolygon(landmark: any, resolution: number): OLStyle[] {
    const props = landmark.getProperties() as LandmarkProperties;
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
          const acreage = landmark.getGeometry().getArea() * 0.000247105;
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
            : null
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
    return (landmark: any, resolution: number): OLStyle[] => {
      const styles: OLStyle[] = [];
      const props = landmark.getProperties() as LandmarkProperties;
      if (this.map.olView.getZoom() >= (props.minZoom ?? 0)) {
        switch (landmark.getGeometry().getType()) {
          case 'Point':
          case 'MultiPoint':
            if (this.showText)
              styles.push(...this.#textPoint(landmark, resolution));
            break;
          case 'LineString':
          case 'MultiLineString':
            if (this.showStroke)
              styles.push(...this.#strokeLine(landmark, resolution));
            if (this.showText)
              styles.push(...this.#textLine(landmark, resolution));
            break;
          case 'Polygon':
          case 'MultiPolygon':
            if (this.showFill)
              styles.push(...this.#fillPolygon(landmark, resolution));
            if (this.showStroke)
              styles.push(...this.#strokePolygon(landmark, resolution));
            if (this.showText)
              styles.push(...this.#textPolygon(landmark, resolution));
            break;
        }
      }
      return styles;
    };
  }
}
