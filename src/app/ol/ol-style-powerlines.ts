import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLGeometry from 'ol/geom/Geometry';
import OLIcon from 'ol/style/Icon';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

// 👇 draws a power line with:
//    -- a styled color
//    -- with an input opacity
//    -- with an input width

// TODO 👇 how to add repeating "bolt" icon?

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

  style(): OLStyleFunction {
    return (river: OLFeature<OLGeometry>, resolution: number): OLStyle => {
      const iconColor = this.map.vars['--map-powerline-icon-color'];
      const lineColor = this.map.vars['--map-powerline-line-color'];
      const width = this.width / resolution;
      return new OLStyle({
        image: new OLIcon({
          color: `rgb(${iconColor})`,
          opacity: this.opacity,
          scale: 1,
          src: 'assets/bolt.svg'
        }),
        stroke: new OLStroke({
          color: `rgba(${lineColor}, ${this.opacity})`,
          width
        })
      });
    };
  }
}
