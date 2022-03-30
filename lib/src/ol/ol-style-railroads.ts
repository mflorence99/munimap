import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { RailroadProperties } from '../geojson';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleRailroadsComponent)
    }
  ],
  selector: 'app-ol-style-railroads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleRailroadsComponent implements OnChanges, Styler {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 24;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 24;
  @Input() maxTrackPixels = 15;
  @Input() minFontSize = 4;
  @Input() minTrackPixels = 3;
  @Input() trackWidth = 15 /* 👈 feet */;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

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
        fill: new OLFill({ color: `rgba(${color}, 1)` }),
        font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
        offsetY: -fontSize,
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
    const trackPixels = this.#trackPixels(resolution);
    return new OLStroke({
      color: `rgba(255, 255, 255, 1)`,
      lineCap: 'butt',
      lineDash: [trackPixels * 4, trackPixels * 4],
      lineJoin: 'bevel',
      width: trackPixels * 0.66
    });
  }

  #fontSize(resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxFontSize, this.fontSize / resolution);
  }

  #strokeEdge(props: RailroadProperties, resolution: number): OLStroke {
    const edge = this.#color(props);
    const trackPixels = this.#trackPixels(resolution);
    return new OLStroke({
      color: `rgba(${edge}, 1)`,
      lineCap: 'butt',
      lineJoin: 'bevel',
      width: trackPixels
    });
  }

  #trackPixels(resolution: number): number {
    // 👉 track width is in feet, resolution is pixels / meter
    return Math.max(
      this.minTrackPixels,
      Math.min(this.maxTrackPixels, this.trackWidth / (resolution * 3.28084))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
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
