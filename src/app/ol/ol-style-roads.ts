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
import OLMultiLineString from 'ol/geom/MultiLineString';
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
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 14;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 20;
  @Input() minFontSize = 8;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawText(props: RoadProperties, resolution: number): OLText {
    const roadWidth = this.#roadWidth(props, resolution);
    const fontSize = roadWidth * 0.8;
    // 👉 if the river label would be too small to see, don't show it
    if (fontSize < this.minFontSize) return null;
    else {
      const color =
        this.map.vars[`--map-road-text-color-${props.class ?? '0'}`];
      return new OLText({
        font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
        fill: new OLFill({ color: `rgba(${color}, 1)` }),
        overflow: false,
        placement: 'line',
        text: props.name
      });
    }
  }

  #fillLane(props: RoadProperties, resolution: number): OLStroke {
    const lane = this.map.vars[`--map-road-lane-${props.class ?? '0'}`];
    const width = this.#roadWidth(props, resolution);
    return new OLStroke({
      color: `rgba(${lane}, 1)`,
      lineCap: 'butt',
      width: width * 0.9
    });
  }

  #roadWidth(props: RoadProperties, resolution: number): number {
    // 👉 roadway width is in feet, resolution is pixels / meter
    //    minimum width 15', double that for the right-of-way
    return (Math.max(props.width, 15) / (resolution * 3.28084)) * 2;
  }

  #strokeEdge(props: RoadProperties, resolution: number): OLStroke {
    const edge = this.map.vars[`--map-road-edge-${props.class ?? '0'}`];
    const roadWidth = this.#roadWidth(props, resolution);
    return new OLStroke({
      color: `rgba(${edge}, 1)`,
      lineCap: 'butt',
      width: roadWidth
    });
  }

  style(): OLStyleFunction {
    return (
      road: OLFeature<OLMultiLineString>,
      resolution: number
    ): OLStyle[] => {
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
