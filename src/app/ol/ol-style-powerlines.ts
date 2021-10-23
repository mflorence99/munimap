import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLIcon from 'ol/style/Icon';
import OLMultiLineString from 'ol/geom/MultiLineString';
import OLPoint from 'ol/geom/Point';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

// 👇 draws a power line with:
//    -- a styled color
//    -- with an input opacity
//    -- with an input width
//    -- a repeating "bolt" icon

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-powerlines',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStylePowerlinesComponent implements OLStyleComponent {
  @Input() opacity = 0.9;
  @Input() width = 3;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawIcons(
    river: OLFeature<OLMultiLineString>,
    _resolution: number
  ): OLStyle[] {
    const iconColor = this.map.vars['--map-powerline-icon-color'];
    const icons: OLStyle[] = [];
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
              image: new OLIcon({
                color: `rgb(${iconColor})`,
                opacity: this.opacity,
                scale: 0.1,
                rotation: -rotation,
                src: 'assets/bolt.svg'
              })
            })
          );
        });
      });
    return icons;
  }

  #drawLine(river: OLFeature<OLMultiLineString>, resolution: number): OLStyle {
    const lineColor = this.map.vars['--map-powerline-line-color'];
    const width = this.width / resolution;
    return new OLStyle({
      stroke: new OLStroke({
        color: `rgba(${lineColor}, ${this.opacity})`,
        width
      })
    });
  }

  style(): OLStyleFunction {
    return (
      river: OLFeature<OLMultiLineString>,
      resolution: number
    ): OLStyle[] => {
      return [
        this.#drawLine(river, resolution),
        ...this.#drawIcons(river, resolution)
      ];
    };
  }
}
