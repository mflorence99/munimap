import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { RailroadProperties } from '../geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLMultiLineString from 'ol/geom/MultiLineString';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-railroads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleRailroadsComponent implements OLStyleComponent {
  @Input() maxRailroadWidth = 3;
  @Input() opacity = 1;
  @Input() railroadWidth = 3;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawLine(
    railroad: OLFeature<OLMultiLineString>,
    resolution: number
  ): OLStyle {
    const props = railroad.getProperties() as RailroadProperties;
    const lineColor = props.active
      ? this.map.vars['--map-railroad-active-color']
      : this.map.vars['--map-railroad-inactive-color'];
    const railroadWidth = this.#railroadWidth(resolution);
    return new OLStyle({
      stroke: new OLStroke({
        color: `rgba(${lineColor}, ${this.opacity})`,
        width: railroadWidth
      })
    });
  }

  #railroadWidth(resolution: number): number {
    // 👉 railroadWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxRailroadWidth, this.railroadWidth / resolution);
  }

  style(): OLStyleFunction {
    return (railroad: any, resolution: number): OLStyle[] => {
      return [this.#drawLine(railroad, resolution)];
    };
  }
}
