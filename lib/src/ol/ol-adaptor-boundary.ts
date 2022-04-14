import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';
import { OLFillPatternType } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorBoundaryComponent)
    }
  ],
  selector: 'app-ol-adaptor-boundary',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorBoundaryComponent implements Adaptor {
  @Input() borderPixels = 5;
  @Input() opacity = 0.5;
  @Input() pattern: OLFillPatternType = 'gravel';

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: '--map-boundary-fill',
        fillOpacity: 1,
        zIndex: 1
      }),
      new LandmarkPropertiesClass({
        fillColor: '--map-boundary-pattern',
        fillOpacity: 1,
        fillPattern: this.pattern,
        zIndex: 2
      }),
      new LandmarkPropertiesClass({
        strokeColor: '--map-boundary-outline',
        strokeOpacity: this.opacity,
        strokePixels: this.borderPixels,
        strokeStyle: 'solid',
        zIndex: 3
      })
    ];
  }
}
