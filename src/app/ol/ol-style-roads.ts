import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { RoadProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-roads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleRoadsComponent implements OLStyleComponent {
  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #fillLane(props: RoadProperties, resolution: number): OLStroke {
    const lane = this.map.vars['--map-road-lane'];
    const width = this.#width(props, resolution);
    return new OLStroke({
      color: `rgba(${lane}, 1)`,
      lineCap: 'butt',
      width: width - 2
    });
  }

  #strokeEdge(props: RoadProperties, resolution: number): OLStroke {
    const edge = this.map.vars['--map-road-edge'];
    const width = this.#width(props, resolution);
    return new OLStroke({ color: `rgba(${edge}, 1)`, lineCap: 'butt', width });
  }

  #width(props: RoadProperties, resolution: number): number {
    // 👉 roadway width is in feet, resolution is pixels / meter
    return +props.width / (resolution * 3.28084);
  }

  style(): OLStyleFunction {
    return (road: OLFeature<any>, resolution: number): OLStyle[] => {
      const props = road.getProperties() as RoadProperties;
      return [
        new OLStyle({
          fill: null,
          stroke: this.#strokeEdge(props, resolution)
        }),
        new OLStyle({
          fill: null,
          stroke: this.#fillLane(props, resolution)
        })
      ];
    };
  }
}
