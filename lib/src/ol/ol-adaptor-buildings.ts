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
  @Input() borderOpacity = 1;
  @Input() borderWidth = 1 /* 👈 feet */;
  @Input() fillOpacity = 1;
  @Input() shadowLength = 6 /* 👈 feet */;
  @Input() shadowOpacity = 0.75;

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: '--map-building-fill',
        fillOpacity: this.fillOpacity,
        shadowColor: '--map-building-outline',
        shadowOffsetFeet: [this.shadowLength, -this.shadowLength],
        shadowOpacity: this.shadowOpacity,
        strokeColor: '--map-building-outline',
        strokeFeet: this.borderWidth,
        strokeOpacity: this.borderOpacity,
        strokeStyle: 'solid'
      })
    ];
  }
}
