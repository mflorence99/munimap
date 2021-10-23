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
import OLGeometry from 'ol/geom/Geometry';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 👇 draws a river with:
//      -- a styled color
//      -- with an input opacity
//      -- with an input width
//    add the name of the river
//      -- with a styled color
//      -- with an input opacity
//      -- with an input font weight, size and family
//    the river name is only shown
//      -- when the resolution is less than an input threshold

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
  @Input() opacity = 0.9;
  @Input() threshold = 2;
  @Input() width = 8;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawLine(props: RiverProperties, resolution: number): OLStroke {
    const color = this.map.vars['--map-river-line-color'];
    // 👉 width is proportional to the resolution,
    //    but no bigger than the nominal size specified
    const width = Math.min(this.width, this.width / resolution);
    return new OLStroke({
      color: `rgba(${color}, ${this.opacity})`,
      width
    });
  }

  #drawText(props: RiverProperties, resolution: number): OLText {
    if (resolution >= this.threshold) return null;
    else {
      const color = this.map.vars['--map-river-text-color'];
      // 👉 fontSize is proportional to the resolution,
      //    but no bigger than the nominal size specified
      const fontSize = Math.min(this.fontSize, this.fontSize / resolution);
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

  style(): OLStyleFunction {
    return (river: OLFeature<OLGeometry>, resolution: number): OLStyle => {
      const props = river.getProperties() as RiverProperties;
      return new OLStyle({
        stroke: this.#drawLine(props, resolution),
        text: this.#drawText(props, resolution)
      });
    };
  }
}
