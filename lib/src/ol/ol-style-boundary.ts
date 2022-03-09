import { OLFillPatternType } from './ol-styler';
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

  constructor(private map: OLMapComponent) {}

  style(): OLStyleFunction {
    return (): OLStyle => {
      const color = this.map.vars['--map-boundary-fill'];
      const shaded = this.map.vars['--map-boundary-shaded'];
      // 🐛 FillPattern sometimes throws InvalidStateError
      let fill = new OLFill({ color: `rgba(${color}, 1)` });
      try {
        fill = new OLFillPattern({
          color: `rgba(${shaded}, 1)`,
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
