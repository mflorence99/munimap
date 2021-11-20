import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { RoadProperties } from '../geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

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
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 24;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 24;
  @Input() minFontSize = 6;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawText(props: RoadProperties, resolution: number): OLText {
    const fontSize = this.#fontSize(resolution);
    // 👉 if the road label would be too small to see, don't show it
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

  #fontSize(resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxFontSize, this.fontSize / resolution);
  }

  #roadWidth(props: RoadProperties, resolution: number): number {
    // 👉 roadway width is in feet, resolution is pixels / meter
    //    minimum width 15', multiply that for the right-of-way
    return (Math.max(props.width, 15) / (resolution * 3.28084)) * 3;
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
    return (road: any, resolution: number): OLStyle[] => {
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