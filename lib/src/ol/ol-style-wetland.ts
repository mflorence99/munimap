import { OLFillPatternType } from './ol-style';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-wetland',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleWetlandComponent implements OLStyleComponent {
  @Input() opacity = 0;
  @Input() pattern: OLFillPatternType = 'swamp';

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (): OLStyle => {
      const fill = this.map.vars['--map-wetland-fill'];
      const swamp = this.map.vars['--map-wetland-swamp'];
      return new OLStyle({
        fill: new OLFillPattern({
          color: `rgba(${swamp}, 1)`,
          fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
          pattern: this.pattern
        }),
        stroke: null
      });
    };
  }
}