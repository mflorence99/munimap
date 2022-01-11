import { BridgeProperties } from '../geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFontSymbol from 'ol-ext/style/FontSymbol';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-bridges',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleBridgesComponent implements OLStyleComponent {
  @Input() iconSize = 15;
  @Input() opacity = 0.75;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (place: any, resolution: number): OLStyle => {
      const props = place.getProperties() as BridgeProperties;
      const iconColor = this.map.vars[`--map-bridge-${props.rygb}-icon-color`];
      const lineColor = this.map.vars['--map-bridge-line-color'];
      return new OLStyle({
        image: new OLFontSymbol({
          color: `rgba(${iconColor}, ${this.opacity})`,
          font: `'Font Awesome'`,
          fontStyle: 'bold',
          form: 'none',
          radius: this.iconSize / resolution,
          stroke: new OLStroke({
            color: `rgba(${lineColor}, ${this.opacity})`,
            width: 0.5
          }),
          text: '\uf1b9' /* 👈 car */
        })
      });
    };
  }
}
