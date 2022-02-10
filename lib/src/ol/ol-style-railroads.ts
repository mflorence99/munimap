import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { RailroadProperties } from '../geojson';

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
  selector: 'app-ol-style-railroads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleRailroadsComponent implements OLStyleComponent {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 24;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 24;
  @Input() minFontSize = 6;
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

  #drawText(props: RailroadProperties, resolution: number): OLText {
    const fontSize = this.#fontSize(resolution);
    // 👉 if the road label would be too small to see, don't show it
    if (fontSize < this.minFontSize) return null;
    else {
      const color = this.#color(props);
      return new OLText({
        font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
        fill: new OLFill({ color: `rgba(${color}, 1)` }),
        // 👇 false b/c road segments can be very short
        overflow: false,
        placement: 'line',
        stroke: new OLStroke({
          color: `rgba(255, 255, 255, 1)`,
          width: 3
        }),
        text: props.name
      });
    }
  }

  #fillTrack(props: RailroadProperties, resolution: number): OLStroke {
    const trackWidth = this.#trackWidth(resolution);
    return new OLStroke({
      color: `rgba(255, 255, 255, 1)`,
      lineCap: 'butt',
      lineDash: [trackWidth * 4, trackWidth * 4],
      lineJoin: 'bevel',
      width: trackWidth * 0.66
    });
  }

  #fontSize(resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxFontSize, this.fontSize / resolution);
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
          stroke: this.#fillTrack(props, resolution),
          text: this.#drawText(props, resolution)
        })
      ];
    };
  }
}
