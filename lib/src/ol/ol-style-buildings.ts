import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFill from 'ol/style/Fill';
import OLPolygon from 'ol/geom/Polygon';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-buildings',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleBuildingsComponent implements OLStyleComponent {
  @Input() shadowLength = 10 /* 👈 feet */;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (building: any): OLStyle[] => {
      const fill = this.map.vars['--map-building-fill'];
      const outline = this.map.vars['--map-building-outline'];
      const shadow = new OLPolygon(building.getGeometry().getCoordinates());
      // 👉 shadow length is in feet, translation units are meters
      const shadowLength = this.shadowLength / 3.28084;
      shadow.translate(shadowLength, -shadowLength);
      return [
        new OLStyle({
          fill: new OLFill({ color: `rgba(${outline}, 0.75)` }),
          geometry: shadow,
          stroke: null
        }),
        new OLStyle({
          fill: new OLFill({ color: `rgba(${fill}, 1)` }),
          stroke: new OLStroke({
            color: `rgba(${outline}, 1)`,
            width: 1
          })
        })
      ];
    };
  }
}
