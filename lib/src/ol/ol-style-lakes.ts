import { OLFillPatternType } from './ol-style';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFill from 'ol/style/Fill';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-lakes',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleLakesComponent implements OLStyleComponent {
  @Input() opacity = 0.5;
  @Input() pattern: OLFillPatternType = 'wave';

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (): OLStyle => {
      const fill = this.map.vars['--map-lake-fill'];
      // 🔥 the wave pattern doesn't really add anything
      // const waves = this.map.vars['--map-lake-waves'];
      return new OLStyle({
        fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
        // fill: new OLFillPattern({
        //   color: `rgba(${waves}, 1)`,
        //   fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
        //   pattern: this.pattern
        // }),
        stroke: null
      });
    };
  }
}
