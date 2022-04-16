import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorBuildingsComponent)
    }
  ],
  selector: 'app-ol-adaptor-buildings',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorBuildingsComponent implements Adaptor {
  @Input() shadowLength = 6 /* 👈 feet */;

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: '--map-building-outline',
        fillOpacity: 0.75,
        offsetFeet: [this.shadowLength, -this.shadowLength],
        zIndex: 1
      }),
      new LandmarkPropertiesClass({
        fillColor: '--map-building-fill',
        fillOpacity: 1,
        strokeColor: '--map-building-outline',
        strokeOpacity: 1,
        strokePixels: 1,
        strokeStyle: 'solid',
        zIndex: 2
      })
    ];
  }
}
