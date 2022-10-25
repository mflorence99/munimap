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
      useExisting: forwardRef(() => OLAdaptorMoonlightComponent)
    }
  ],
  selector: 'app-ol-adaptor-moonlight',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorMoonlightComponent implements Adaptor {
  @Input() pattern: OLFillPatternType = 'dot';

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: '--map-moonlight-pattern',
        fillOpacity: 1,
        fillPattern: this.pattern,
        fillPatternScale: 0.25
      })
    ];
  }
}
