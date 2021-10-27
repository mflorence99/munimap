import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLPolygon from 'ol/geom/Polygon';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 👇 fills and outlines a generic polygon with:
//    -- an outline
//       -- with a styled color
//       -- with an input width
//    -- a fill when selected
//       -- with a styled color
//       -- with an input opacity
//    -- the ID of the feature when selected
//       -- with a styled color
//       -- with an input font weight, size and family

export type FilterFunction = (feature: OLFeature<any>) => boolean;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-polygons',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStylePolygonsComponent implements OLStyleComponent {
  @Input() filter: FilterFunction;
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 20;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() opacity = 0.1;
  @Input() width = 3;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (feature: OLFeature<OLPolygon>): OLStyle => {
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
          width: this.width
        })
      });
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: OLFeature<OLPolygon>): OLStyle => {
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
            width: this.width
          })
        });
      else
        return new OLStyle({
          fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
          stroke: new OLStroke({
            color: `rgba(${stroke}, 1)`,
            width: this.width
          }),
          text: new OLText({
            font: `${this.fontWeight} ${this.fontSize}px '${this.fontFamily}'`,
            fill: new OLFill({ color: `rgba(${color}, 1)` }),
            overflow: true,
            placement: 'point',
            text: feature.getId() as string
          })
        });
    };
  }
}
