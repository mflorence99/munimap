import { OLFillPatternType } from './ol-style';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { OLStyleWaterbodiesComponent } from './ol-style-waterbodies';
import { WetlandProperties } from '../geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFillPattern from 'ol-ext/style/FillPattern';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-wetland',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleWetlandComponent implements OLStyleComponent {
  #waterbodiesStyleFn: OLStyleFunction;

  @Input() opacity = 0.5;
  @Input() pattern: OLFillPatternType = 'swamp';

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    // 👇 alternate style for wetlands we want to depict just like waterbodies
    this.#waterbodiesStyleFn = new OLStyleWaterbodiesComponent(
      this.layer,
      this.map
    ).style();
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (wetland: any, resolution: number): OLStyle => {
      const props = wetland.getProperties() as WetlandProperties;
      if (props.type === 'marsh') {
        const swamp = this.map.vars['--map-wetland-swamp'];
        // 🐛 FillPattern sometimes throws InvalidStateError
        try {
          return new OLStyle({
            fill: new OLFillPattern({
              color: `rgba(${swamp}, ${this.opacity})`,
              pattern: this.pattern
            }),
            stroke: null
          });
        } catch (ignored) {
          return null;
        }
      }
      // 👇 alternate style for wetlands we want to depict just like waterbodies
      else if (props.type === 'water')
        return this.#waterbodiesStyleFn(wetland, resolution) as OLStyle;
    };
  }
}
