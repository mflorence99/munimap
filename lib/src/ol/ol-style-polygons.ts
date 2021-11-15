import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

export type FilterFunction = (feature: OLFeature<any>) => boolean;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-polygons',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStylePolygonsComponent implements OLStyleComponent {
  @Input() borderWidth = 3;
  @Input() filter: FilterFunction;
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 20;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() opacity = 0.1;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (feature: any): OLStyle => {
      const disabled = this.map.vars['--map-feature-disabled'];
      const stroke = this.map.vars['--map-feature-outline'];
      const unselectable = this.filter && !this.filter(feature);
      const color = unselectable
        ? `rgba(${disabled}, ${this.opacity})`
        : [0, 0, 0, 0];
      return new OLStyle({
        // 👇 need this so we can click on the feature
        fill: new OLFill({ color }),
        stroke: new OLStroke({
          color: `rgba(${stroke}, 1)`,
          width: this.borderWidth
        })
      });
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: any): OLStyle => {
      const color = this.map.vars['--map-feature-text-color'];
      const disabled = this.map.vars['--map-feature-disabled'];
      const fill = this.map.vars['--map-feature-fill'];
      const stroke = this.map.vars['--map-feature-outline'];
      const unselectable = this.filter && !this.filter(feature);
      if (unselectable)
        return new OLStyle({
          fill: new OLFill({ color: `rgba(${disabled}, ${this.opacity})` }),
          stroke: new OLStroke({
            color: `rgba(${stroke}, 1)`,
            width: this.borderWidth
          })
        });
      else
        return new OLStyle({
          fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
          stroke: new OLStroke({
            color: `rgba(${stroke}, 1)`,
            width: this.borderWidth
          }),
          text: new OLText({
            font: `${this.fontWeight} ${this.fontSize}px '${this.fontFamily}'`,
            fill: new OLFill({ color: `rgba(${color}, 1)` }),
            overflow: true,
            placement: 'point',
            text: `${feature.getId()}`
          })
        });
    };
  }
}
