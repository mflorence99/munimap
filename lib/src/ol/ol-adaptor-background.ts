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
      useExisting: forwardRef(() => OLAdaptorBackgroundComponent)
    }
  ],
  selector: 'app-ol-adaptor-background',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorBackgroundComponent implements Adaptor {
  @Input() fillColor = '--rgb-gray-900';
  @Input() fillOpacity = 1;

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: this.fillColor,
        fillOpacity: this.fillOpacity
      })
    ];
  }
}
