import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { RailroadProperties } from '../geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-railroads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleRailroadsComponent implements OLStyleComponent {
  @Input() trackWidth = 15;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #color(props: RailroadProperties): string {
    return props.active
      ? this.map.vars['--map-railroad-active-color']
      : this.map.vars['--map-railroad-inactive-color'];
  }

  #fillTrack(props: RailroadProperties, resolution: number): OLStroke {
    const trackWidth = this.#trackWidth(resolution);
    return new OLStroke({
      color: `rgba(255, 255, 255, 1)`,
      lineCap: 'butt',
      lineDash: [trackWidth / 2, trackWidth],
      lineJoin: 'bevel',
      width: trackWidth * 0.66
    });
  }

  #strokeEdge(props: RailroadProperties, resolution: number): OLStroke {
    const edge = this.#color(props);
    const trackWidth = this.#trackWidth(resolution);
    return new OLStroke({
      color: `rgba(${edge}, 1)`,
      lineCap: 'butt',
      lineJoin: 'bevel',
      width: trackWidth
    });
  }

  #trackWidth(resolution: number): number {
    // 👉 track width is in feet, resolution is pixels / meter
    return Math.min(this.trackWidth, this.trackWidth / (resolution * 3.28084));
  }
  style(): OLStyleFunction {
    return (railroad: any, resolution: number): OLStyle[] => {
      const props = railroad.getProperties() as RailroadProperties;
      return [
        new OLStyle({
          fill: null,
          stroke: this.#strokeEdge(props, resolution)
        }),
        new OLStyle({
          fill: null,
          stroke: this.#fillTrack(props, resolution)
        })
      ];
    };
  }
}
