import { OLFillPatternType } from './ol-style';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { WetlandProperties } from '../geojson';

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
  @Input() opacity = 0.5;
  @Input() pattern: OLFillPatternType = 'swamp';

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (wetland: any): OLStyle => {
      const props = wetland.getProperties() as WetlandProperties;
      if (props.type === 'marsh') {
        const fill = this.map.vars['--map-wetland-swamp'];
        // 🐛 FillPattern sometimes throws InvalidStateError
        try {
          return new OLStyle({
            fill: new OLFillPattern({
              color: `rgba(${fill}, ${this.opacity})`,
              pattern: this.pattern
            }),
            stroke: null
          });
        } catch (ignored) {
          return null;
        }
      }
      // 👇 alternate style for wetlands we want to depict just like waterbodies
      else if (props.type === 'water') {
        const fill = this.map.vars['--map-waterbody-fill'];
        return new OLStyle({
          fill: new OLFill({ color: `rgba(${fill}, 1)` }),
          stroke: null
        });
      }
    };
  }
}
