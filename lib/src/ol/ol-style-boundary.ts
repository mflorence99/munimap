import { OLFillPatternType } from './ol-styler';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleBoundaryComponent)
    }
  ],
  selector: 'app-ol-style-boundary',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleBoundaryComponent implements Styler {
  @Input() pattern: OLFillPatternType = 'gravel';

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (): OLStyle => {
      const gravel = this.map.vars['--map-boundary-fill'];
      // 🐛 FillPattern sometimes throws InvalidStateError
      let fill = new OLFill({ color: `rgba(255, 255, 255, 1)` });
      try {
        fill = new OLFillPattern({
          color: `rgba(${gravel}, 1)`,
          fill: fill,
          pattern: this.pattern
        });
      } catch (ignored) {}
      // 👉 add texture to background inside boundary
      return new OLStyle({
        fill: fill,
        stroke: null
      });
    };
  }
}
