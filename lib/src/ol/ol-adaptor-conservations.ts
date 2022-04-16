import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';
import { ParcelProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorConservationsComponent)
    }
  ],
  selector: 'app-ol-adaptor-conservations',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorConservationsComponent implements Adaptor {
  @Input() borderPixels = 1;
  @Input() opacity = 0.25;

  // 👇 construct LandmarkProperties
  adapt(conservation: ParcelProperties): LandmarkProperties[] {
    if (
      conservation.usage &&
      ['500', '501', '502'].includes(conservation.usage)
    ) {
      return [
        new LandmarkPropertiesClass({
          fillColor: `--map-parcel-fill-u${conservation.usage}`,
          fillOpacity: this.opacity,
          strokeColor: '--map-conservation-outline',
          strokeOpacity: 1,
          strokePixels: this.borderPixels,
          strokeStyle: 'dashed'
        })
      ];
    } else return [];
  }
}
