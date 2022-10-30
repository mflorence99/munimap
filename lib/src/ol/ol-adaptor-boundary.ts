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
  @Input() borderOpacity = 0.5;
  @Input() borderPixels = 5;
  @Input() fillOpacity = 1;
  @Input() fillPattern: OLFillPatternType = 'gravel';

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: '--map-boundary-fill',
        fillOpacity: this.fillOpacity,
        zIndex: 1
      }),
      new LandmarkPropertiesClass({
        fillColor: '--map-boundary-pattern',
        fillOpacity: this.fillOpacity,
        fillPattern: this.fillPattern,
        zIndex: 2
      }),
      new LandmarkPropertiesClass({
        strokeColor: '--map-boundary-outline',
        strokeOpacity: this.borderOpacity,
        strokePixels: this.borderPixels,
        strokeStyle: 'solid',
        zIndex: 3
      })
    ];
  }
}
