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

// 👇 draws a building with:
//    -- a styled fill
//    -- a styled outline
//    -- with an input opacity
//    hides buildings when
//    -- the resoution exceeds a threshold

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-buildings',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleBuildingsComponent implements OLStyleComponent {
  @Input() opacity = 0.5;
  @Input() threshold = 2;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (building: OLFeature<any>, resolution: number): OLStyle => {
      const fill = this.map.vars['--map-building-fill'];
      const outline = this.map.vars['--map-building-outline'];
      if (resolution >= this.threshold) return null;
      else {
        return new OLStyle({
          fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
          stroke: new OLStroke({
            color: `rgba(${outline}, ${this.opacity})`,
            width: 1
          })
        });
      }
    };
  }
}
