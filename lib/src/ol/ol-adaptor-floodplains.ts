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
      useExisting: forwardRef(() => OLAdaptorFloodplainsComponent)
    }
  ],
  selector: 'app-ol-adaptor-floodplains',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorFloodplainsComponent implements Adaptor {
  @Input() fillOpacity = 0.1;

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: '--map-floodplain-fill',
        fillOpacity: this.fillOpacity
      })
    ];
  }
}
