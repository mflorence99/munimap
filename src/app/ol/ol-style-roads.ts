/* eslint-disable @typescript-eslint/naming-convention */
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { RoadProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLGeometry from 'ol/geom/Geometry';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 👇 draws a road with:
//    -- a width computed to be proportional to the actual roadway width
//    -- with an edge
//       -- with a styled color that depends on the road class
//    -- with a single lane
//       -- with a styled color that depends on the road class
//    -- with the road name inside the lane
//       -- with a styled color that depends on the road class
//      -- with an input font weight, size and family
//   -- the road is only shown
//      -- when the resolution is less than an input threshold
//      -- each class has its own threshold

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-roads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleRoadsComponent implements OLStyleComponent {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 10;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() threshold: Record<string, number> = {
    'I': 24,
    'II': 24,
    'IIII': 24,
    'IV': 24,
    'V': 3,
    'VI': 3,
    '0': 3
  };

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawText(props: RoadProperties, resolution: number): OLText {
    const color = this.map.vars[`--map-road-text-color-${props.class ?? '0'}`];
    return new OLText({
      font: `${this.fontWeight} ${this.fontSize / resolution}px '${
        this.fontFamily
      }'`,
      fill: new OLFill({ color: `rgba(${color}, 1)` }),
      overflow: false,
      placement: 'line',
      text: props.name
    });
  }

  #fillLane(props: RoadProperties, resolution: number): OLStroke {
    const lane = this.map.vars[`--map-road-lane-${props.class ?? '0'}`];
    const width = this.#width(props, resolution);
    return new OLStroke({
      color: `rgba(${lane}, 1)`,
      lineCap: 'butt',
      width: width * 0.9
    });
  }

  #strokeEdge(props: RoadProperties, resolution: number): OLStroke {
    const edge = this.map.vars[`--map-road-edge-${props.class ?? '0'}`];
    const width = this.#width(props, resolution);
    return new OLStroke({ color: `rgba(${edge}, 1)`, lineCap: 'butt', width });
  }

  #width(props: RoadProperties, resolution: number): number {
    // 👉 roadway width is in feet, resolution is pixels / meter
    //    minimum width 15', double that for the right-of-way
    return (Math.max(props.width, 15) / (resolution * 3.28084)) * 2;
  }

  style(): OLStyleFunction {
    return (road: OLFeature<OLGeometry>, resolution: number): OLStyle[] => {
      const props = road.getProperties() as RoadProperties;
      if (resolution >= this.threshold[props.class]) return null;
      else
        return [
          new OLStyle({
            fill: null,
            stroke: this.#strokeEdge(props, resolution)
          }),
          new OLStyle({
            fill: null,
            stroke: this.#fillLane(props, resolution),
            text: this.#drawText(props, resolution)
          })
        ];
    };
  }
}
