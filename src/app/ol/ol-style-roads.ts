import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { RoadProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

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

  #drawText(props: RoadProperties, resolution: number): OLText {
    const klass = props.class ?? '0';
    const color = this.map.vars[`--map-road-text-color-${klass}`];
    const fontFamily = this.map.vars['--map-road-text-font-family'];
    const fontSize = +this.map.vars['--map-road-text-font-size'] / resolution;
    if (fontSize < 6) return null;
    else
      return new OLText({
        font: `normal ${fontSize}px '${fontFamily}'`,
        fill: new OLFill({ color: `rgba(${color}, 1)` }),
        overflow: false,
        placement: 'line',
        text: props.name
      });
  }

  #fillLane(props: RoadProperties, resolution: number): OLStroke {
    const klass = props.class ?? '0';
    const lane = this.map.vars[`--map-road-lane-${klass}`];
    const width = this.#width(props, resolution);
    return new OLStroke({
      color: `rgba(${lane}, 1)`,
      lineCap: 'butt',
      width: width * 0.9
    });
  }

  #strokeEdge(props: RoadProperties, resolution: number): OLStroke {
    const klass = props.class ?? '0';
    const edge = this.map.vars[`--map-road-edge-${klass}`];
    const width = this.#width(props, resolution);
    return new OLStroke({ color: `rgba(${edge}, 1)`, lineCap: 'butt', width });
  }

  #width(props: RoadProperties, resolution: number): number {
    // 👉 roadway width is in feet, resolution is pixels / meter
    //    minimum width 15', double that for the right-of-way
    return (Math.max(props.width, 15) / (resolution * 3.28084)) * 2;
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
          stroke: this.#fillLane(props, resolution),
          text: this.#drawText(props, resolution)
        })
      ];
    };
  }
}
