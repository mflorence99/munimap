import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-buildings',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleBuildingsComponent implements OLStyleComponent {
  @Input() opacity = 0.66;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (_building: OLFeature<any>, _resolution: number): OLStyle => {
      const fill = this.map.vars['--map-building-fill'];
      const outline = this.map.vars['--map-building-outline'];
      return new OLStyle({
        fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
        stroke: new OLStroke({
          color: `rgba(${outline}, ${this.opacity})`,
          width: 1
        })
      });
    };
  }
}
