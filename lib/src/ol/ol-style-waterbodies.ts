import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleWaterbodiesComponent)
    }
  ],
  selector: 'app-ol-style-waterbodies',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleWaterbodiesComponent implements Styler {
  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (): OLStyle => {
      const fill = this.map.vars['--map-waterbody-fill'];
      return new OLStyle({
        fill: new OLFill({ color: `rgba(${fill}, 1)` }),
        stroke: null
      });
    };
  }
}
