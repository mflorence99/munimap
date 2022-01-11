import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFontSymbol from 'ol-ext/style/FontSymbol';
import OLMultiLineString from 'ol/geom/MultiLineString';
import OLPoint from 'ol/geom/Point';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-powerlines',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStylePowerlinesComponent implements OLStyleComponent {
  @Input() iconSize = 15;
  @Input() maxPowerLineWidth = 3;
  @Input() opacity = 1;
  @Input() powerLineWidth = 3;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

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
                color: `rgba(${iconColor}, ${this.opacity})`,
                font: `'Font Awesome'`,
                fontStyle: 'bold',
                form: 'none',
                radius: this.iconSize / resolution,
                rotation: -rotation,
                stroke: new OLStroke({
                  color: `rgba(${lineColor}, ${this.opacity})`,
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
    powerLine: OLFeature<OLMultiLineString>,
    resolution: number
  ): OLStyle {
    const lineColor = this.map.vars['--map-powerline-line-color'];
    const powerLineWidth = this.#powerLineWidth(resolution);
    return new OLStyle({
      stroke: new OLStroke({
        color: `rgba(${lineColor}, ${this.opacity})`,
        width: powerLineWidth
      })
    });
  }

  #powerLineWidth(resolution: number): number {
    // 👉 powerLineWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxPowerLineWidth, this.powerLineWidth / resolution);
  }

  style(): OLStyleFunction {
    return (powerLine: any, resolution: number): OLStyle[] => {
      return [
        this.#drawLine(powerLine, resolution),
        ...this.#drawIcons(powerLine, resolution)
      ];
    };
  }
}
