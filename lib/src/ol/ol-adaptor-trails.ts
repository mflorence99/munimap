import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';
import { TrailProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorTrailsComponent)
    }
  ],
  selector: 'app-ol-adaptor-trails',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorTrailsComponent implements Adaptor {
  // 👇 convert a Trail to a Landmark
  adapt(trail: TrailProperties): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fontColor: '--map-trail-text-color',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'medium',
        fontStyle: 'italic',
        lineChunk: true,
        lineSpline: true,
        name: trail.name,
        strokeColor: '--map-trail-line-color',
        strokeOpacity: 1,
        strokeStyle: 'dashed',
        strokeWidth: 'medium',
        zIndex: 1
      })
    ];
  }
}
