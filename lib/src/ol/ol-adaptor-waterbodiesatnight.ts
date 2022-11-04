import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';
import { OLFillPatternType } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

// 🔥 highly experimental -- would like to show some reflection at least!

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorWaterbodiesAtNightComponent)
    }
  ],
  selector: 'app-ol-adaptor-waterbodiesatnight',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorWaterbodiesAtNightComponent implements Adaptor {
  @Input() fillOpacity = 1;
  @Input() pattern: OLFillPatternType = 'conglomerate2';
  @Input() patternOpacity = 1;
  @Input() patternScale = 0.5;

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: '--map-waterbodyatnight-fill',
        fillOpacity: this.fillOpacity
      }),
      new LandmarkPropertiesClass({
        fillColor: '--map-waterbodyatnight-pattern',
        fillOpacity: this.patternOpacity,
        fillPattern: this.pattern,
        fillPatternScale: this.patternScale
      })
    ];
  }
}