import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';
import { input } from '@angular/core';

// 🔥 highly experimental

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorBuildingsAtNightComponent)
    }
  ],
  selector: 'app-ol-adaptor-buildingsatnight',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorBuildingsAtNightComponent implements Adaptor {
  fillOpacity = input(1);

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: '--map-buildingatnight-fill',
        fillOpacity: this.fillOpacity()
      })
    ];
  }
}
