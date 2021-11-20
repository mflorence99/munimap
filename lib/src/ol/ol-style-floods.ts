import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

// 🔥 TEMPORARY

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-floods',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleFloodsComponent implements OLStyleComponent {
  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    const color = this.map.vars['--map-flood-outline'];
    return (): OLStyle => {
      return new OLStyle({
        stroke: new OLStroke({
          color: `rgba(${color}, 1)`,
          lineDash: [4, 8],
          width: 2
        })
      });
    };
  }
}
