import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { TrailProperties } from '../common';

import { landmarkStyles } from '../common';

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
    const base = landmarkStyles['trail'];
    return base.properties.map((props) => ({
      ...props,
      name: props.fontColor ? trail.name : null
    }));
  }
}
