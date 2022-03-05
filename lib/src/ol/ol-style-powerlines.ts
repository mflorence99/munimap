import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFeature from 'ol/Feature';
import OLFontSymbol from 'ol-ext/style/FontSymbol';
import OLMultiLineString from 'ol/geom/MultiLineString';
import OLPoint from 'ol/geom/Point';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStylePowerlinesComponent)
    }
  ],
  selector: 'app-ol-style-powerlines',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStylePowerlinesComponent implements Styler {
  @Input() iconSize = 15;
  @Input() maxPowerlinePixels = 3;
  @Input() powerlineWidth = 10 /* 👈 feet */;

  constructor(private map: OLMapComponent) {}

  #drawIcons(
    river: OLFeature<OLMultiLineString>,
    resolution: number
  ): OLStyle[] {
    const icons: OLStyle[] = [];
    const iconColor = this.map.vars['--map-powerline-icon-color'];
    const lineColor = this.map.vars['--map-powerline-line-color'];
    // genius!! 👉 https://stackoverflow.com/questions/38391780
    river
      .getGeometry()
      .getLineStrings()
      .forEach((lineString) => {
        lineString.forEachSegment((start, end) => {
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const rotation = Math.atan2(dy, dx);
          icons.push(
            new OLStyle({
              geometry: new OLPoint(end),
              image: new OLFontSymbol({
                color: `rgba(${iconColor}, 1)`,
                font: `'Font Awesome'`,
                fontStyle: 'bold',
                form: 'none',
                radius: this.iconSize / resolution,
                rotation: -rotation,
                stroke: new OLStroke({
                  color: `rgba(${lineColor}, 1)`,
                  width: 1
                }),
                text: '\uf0e7' /* 👈 bolt */
              })
            })
          );
        });
      });
    return icons;
  }

  #drawLine(
    powerline: OLFeature<OLMultiLineString>,
    resolution: number
  ): OLStyle {
    const lineColor = this.map.vars['--map-powerline-line-color'];
    const powerlinePixels = this.#powerlinePixels(resolution);
    return new OLStyle({
      stroke: new OLStroke({
        color: `rgba(${lineColor}, 1)`,
        width: powerlinePixels
      })
    });
  }

  #powerlinePixels(resolution: number): number {
    // 👉 powerlineWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(
      this.maxPowerlinePixels,
      this.powerlineWidth / (resolution * 3.28084)
    );
  }

  style(): OLStyleFunction {
    return (powerline: any, resolution: number): OLStyle[] => {
      return [
        this.#drawLine(powerline, resolution),
        ...this.#drawIcons(powerline, resolution)
      ];
    };
  }
}
