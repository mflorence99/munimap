import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { RiverProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLMultiLineString from 'ol/geom/MultiLineString';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-rivers',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleRiversComponent implements OLStyleComponent {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 20;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 20;
  @Input() maxRiverWidth = 8;
  @Input() minFontSize = 8;
  @Input() opacity = 0.9;
  @Input() riverWidth = 8;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawLine(props: RiverProperties, resolution: number): OLStroke {
    const color = this.map.vars['--map-river-line-color'];
    const riverWidth = this.#riverWidth(resolution);
    return new OLStroke({
      color: `rgba(${color}, ${this.opacity})`,
      width: riverWidth
    });
  }

  #drawText(props: RiverProperties, resolution: number): OLText {
    const fontSize = this.#fontSize(resolution);
    // 👉 if the river label would be too small to see, don't show it
    if (fontSize < this.minFontSize) return null;
    else {
      const color = this.map.vars['--map-river-text-color'];
      return new OLText({
        fill: new OLFill({ color: `rgba(${color}, ${this.opacity})` }),
        font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
        placement: 'line',
        stroke: new OLStroke({
          color: `rgba(255, 255, 255, ${this.opacity})`,
          width: 3
        }),
        text: props.section
      });
    }
  }

  #fontSize(resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxFontSize, this.fontSize / resolution);
  }

  #riverWidth(resolution: number): number {
    // 👉 riverWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxRiverWidth, this.riverWidth / resolution);
  }

  style(): OLStyleFunction {
    return (
      river: OLFeature<OLMultiLineString>,
      resolution: number
    ): OLStyle => {
      const props = river.getProperties() as RiverProperties;
      return new OLStyle({
        stroke: this.#drawLine(props, resolution),
        text: this.#drawText(props, resolution)
      });
    };
  }
}
