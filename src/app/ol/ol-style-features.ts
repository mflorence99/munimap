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

// 👇 fills and outlines a generic feature with:
//    -- an outline
//       -- with a styled color
//       -- with an input width
//    -- a fill when selected
//       -- with a styled color
//       -- with an input opacity
//    -- the ID of the feature when selected
//       -- with a styled color
//       -- with an input font weight, size and family

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-features',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleFeaturesComponent implements OLStyleComponent {
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
    return (_feature: OLFeature<any>, _resolution: number): OLStyle => {
      const stroke = this.map.vars['--map-feature-outline'];
      return new OLStyle({
        // 👇 need this so we can click on the feature
        fill: new OLFill({ color: [0, 0, 0, 0] }),
        stroke: new OLStroke({
          color: `rgba(${stroke}, 1)`,
          width: this.width
        })
      });
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: OLFeature<any>, _resolution: number): OLStyle => {
      const color = this.map.vars['--map-feature-text-color'];
      const fill = this.map.vars['--map-feature-fill'];
      const stroke = this.map.vars['--map-feature-outline'];
      return new OLStyle({
        fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
        stroke: new OLStroke({
          color: `rgba(${stroke}, 1)`,
          width: this.width
        }),
        text: new OLText({
          font: `${this.fontWeight} ${this.fontSize}px '${this.fontFamily}'`,
          fill: new OLFill({ color: `rgba(${color}, 1)` }),
          placement: 'point',
          text: feature.getId() as string
        })
      });
    };
  }
}
