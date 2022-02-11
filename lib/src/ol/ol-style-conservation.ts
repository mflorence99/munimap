import { ConservationProperties } from '../geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-conservation',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleConservationComponent implements OLStyleComponent {
  @Input() borderPixels = 2;
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 24;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 24;
  @Input() minFontSize = 8;
  @Input() opacity = 0.15;
  @Input() textAlign = 'center';
  @Input() textBaseline = 'bottom';

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawText(props: ConservationProperties, resolution: number): OLText {
    const color = this.map.vars['--map-place-text-color'];
    const fontSize = this.#fontSize(props, resolution);
    // 👉 if the label would be too small to see, don't show anything
    if (fontSize < this.minFontSize) return null;
    else {
      return new OLText({
        fill: new OLFill({ color: `rgba(${color}, 1)` }),
        font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
        placement: 'point',
        stroke: new OLStroke({
          color: `rgba(255, 255, 255, 1)`,
          width: 3
        }),
        text: this.#titleCase(props.name).replace(/ /g, '\n'),
        textAlign: this.textAlign,
        textBaseline: this.textBaseline
      });
    }
  }

  #fontSize(props: ConservationProperties, resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxFontSize, this.fontSize / resolution);
  }

  #titleCase(text: string): string {
    return text.replace(
      /\w\S*/g,
      (str) => str.charAt(0).toUpperCase() + str.substring(1).toLowerCase()
    );
  }

  style(): OLStyleFunction {
    return (conservation: any, resolution: number): OLStyle => {
      const props = conservation.getProperties() as ConservationProperties;
      const fill = this.map.vars['--map-conservation-fill'];
      const stroke = this.map.vars['--map-conservation-outline'];
      return new OLStyle({
        text: this.#drawText(props, resolution),
        fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
        stroke: new OLStroke({
          color: `rgba(${stroke}, 1)`,
          width: this.borderPixels
        })
      });
    };
  }
}
