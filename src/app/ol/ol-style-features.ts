import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 👇 for use on generic features

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-features',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleFeaturesComponent implements OLStyleComponent {
  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (): OLStyle => {
      const stroke = this.map.vars['--map-feature-outline'];
      const width = +this.map.vars['--map-feature-outline-width'];
      return new OLStyle({
        fill: new OLFill({ color: [0, 0, 0, 0] }),
        stroke: new OLStroke({ color: `rgba(${stroke}, 0.75)`, width })
      });
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: OLFeature<any>, _resolution: number): OLStyle => {
      const color = this.map.vars['--map-feature-text-color'];
      const fill = this.map.vars['--map-feature-fill'];
      const fontFamily = this.map.vars['--map-feature-text-font-family'];
      const stroke = this.map.vars['--map-feature-outline'];
      const width = +this.map.vars['--map-feature-outline-width'];
      return new OLStyle({
        fill: new OLFill({ color: `rgba(${fill}, 0.1)` }),
        stroke: new OLStroke({ color: `rgba(${stroke}, 0.75)`, width }),
        text: new OLText({
          font: `bold 20px '${fontFamily}'`,
          fill: new OLFill({ color: `rgba(${color}, 0.75)` }),
          placement: 'point',
          text: feature.getId() as string
        })
      });
    };
  }
}
