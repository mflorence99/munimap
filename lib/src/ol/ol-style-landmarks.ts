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

import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleLandmarksComponent)
    }
  ],
  selector: 'app-ol-style-landmarks',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleLandmarksComponent implements OnChanges, Styler {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize_large = 16 /* 👈 pixels */;
  @Input() fontSize_medium = 12 /* 👈 pixels */;
  @Input() fontSize_small = 8 /* 👈 pixels */;
  @Input() minFontSize = 4 /* 👈 pixels */;
  @Input() showFill = false;
  @Input() showStroke = false;
  @Input() showText = false;
  @Input() strokeWidth_thick = 10 /* 👈 feet */;
  @Input() strokeWidth_thin = 3 /* 👈 feet */;

  constructor(
    private decimal: DecimalPipe,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #fill(landmark: any, _resolution: number): OLStyle[] {
    const props = landmark.getProperties() as LandmarkProperties;
    const styles: OLStyle[] = [];
    if (props.fillColor && props.fillOpacity > 0) {
      const fillColor = this.map.vars[props.fillColor];
      const fill = new OLStyle({
        fill: new OLFill({
          color: `rgba(${fillColor}, ${props.fillOpacity})`
        })
      });
      styles.push(fill);
    }
    return styles;
  }

  #fontSize(key: string, resolution: number): number {
    // 👇 fontSize in pixels is proportional to resolution
    //    but no larger than the a nominal maxmimum which is for
    //    simplicity just the raw number of pixels
    const pixels = this[key];
    return Math.min(pixels, pixels / resolution);
  }

  #stroke(landmark: any, resolution: number): OLStyle[] {
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
        `strokeWidth_${props.strokeWidth}`,
        resolution
      );
      // 👇 a solid stroke is simple
      if (props.strokeStyle === 'solid') {
        const stroke = new OLStyle({
          stroke: new OLStroke({
            color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
            width: strokePixels
          })
        });
        styles.push(stroke);
      }
      // 👇 dashed strokes are a bit more complicated
      else if (props.strokeStyle === 'dashed') {
        const white = new OLStyle({
          stroke: new OLStroke({
            color: `rgba(255, 255, 255, ${props.strokeOpacity})`,
            width: strokePixels
          })
        });
        const dashed = new OLStyle({
          stroke: new OLStroke({
            color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
            lineCap: 'square',
            lineDash:
              strokePixels > 1
                ? [strokePixels, strokePixels * 2]
                : [strokePixels * 2, strokePixels],
            width: strokePixels
          })
        });
        styles.push(white, dashed);
      }
    }
    return styles;
  }

  #text(landmark: any, resolution: number): OLStyle[] {
    const props = landmark.getProperties() as LandmarkProperties;
    const styles: OLStyle[] = [];
    if (
      props.fontColor &&
      props.fontOpacity > 0 &&
      props.fontSize &&
      props.fontStyle &&
      props.name
    ) {
      const fontSize = this.#fontSize(`fontSize_${props.fontSize}`, resolution);
      // 👇 only show text if font size greater than minimum
      if (fontSize >= this.minFontSize) {
        const fontColor = this.map.vars[props.fontColor];
        let text = props.name.replace(/ /g, '\n');
        if (props.showAcreage) {
          const acreage = landmark.getGeometry().getArea() * 0.000247105;
          text += `\n(${this.decimal.transform(acreage, '1.0-2')} ac)`;
        }
        const name = new OLStyle({
          text: new OLText({
            fill: new OLFill({
              color: `rgba(${fontColor}, ${props.fontOpacity})`
            }),
            font: `${props.fontStyle} ${fontSize}px '${this.fontFamily}'`,
            overflow: true,
            stroke: props.fontOutline
              ? new OLStroke({
                  color: `rgba(255, 255, 255, 1)`,
                  width: 3
                })
              : null,
            text: text
          })
        });
        styles.push(name);
      }
    }
    return styles;
  }

  #width(key: string, resolution: number): number {
    // 👇 width in pixels is proportional to resolution in meters
    //    but no larger than the a nominal maxmimum which is for
    //    simplicity just the raw number of feet
    const feet = this[key];
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
      if (this.showFill) styles.push(...this.#fill(landmark, resolution));
      if (this.showStroke) styles.push(...this.#stroke(landmark, resolution));
      if (this.showText) styles.push(...this.#text(landmark, resolution));
      return styles;
    };
  }
}
