import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';
import { TrailProperties } from '../geojson';

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
      useExisting: forwardRef(() => OLStyleTrailsComponent)
    }
  ],
  selector: 'app-ol-style-trails',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleTrailsComponent implements OnChanges, Styler {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 24;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 24;
  @Input() maxTrailPixels = 3;
  @Input() minFontSize = 4;
  @Input() trailWidth = 10 /* 👈 feet */;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #drawLine(props: TrailProperties, resolution: number): OLStroke {
    const color = this.map.vars['--map-trail-line-color'];
    const trailPixels = this.#trailPixels(resolution);
    return new OLStroke({
      color: `rgba(${color}, 1)`,
      lineDash:
        trailPixels > 1
          ? [trailPixels, trailPixels * 2]
          : [trailPixels * 2, trailPixels],
      width: trailPixels
    });
  }

  #drawText(props: TrailProperties, resolution: number): OLText {
    const fontSize = this.#fontSize(resolution);
    // 👉 if the trail label would be too small to see, don't show it
    if (fontSize < this.minFontSize) return null;
    else {
      const color = this.map.vars['--map-trail-text-color'];
      return new OLText({
        fill: new OLFill({ color: `rgba(${color}, 1)` }),
        font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
        offsetY: +fontSize,
        placement: 'line',
        stroke: new OLStroke({
          color: `rgba(255, 255, 255, 1)`,
          width: 3
        }),
        text: props.name
      });
    }
  }

  #fontSize(resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxFontSize, this.fontSize / resolution);
  }

  #trailPixels(resolution: number): number {
    // 👉 trailWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(
      this.maxTrailPixels,
      this.trailWidth / (resolution * 3.28084)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (trail: any, resolution: number): OLStyle => {
      const props = trail.getProperties() as TrailProperties;
      return new OLStyle({
        stroke: this.#drawLine(props, resolution),
        text: this.#drawText(props, resolution)
      });
    };
  }
}
