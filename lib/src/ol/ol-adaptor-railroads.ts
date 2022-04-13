import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { RailroadProperties } from '../common';

import { landmarkStyles } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorRailroadsComponent)
    }
  ],
  selector: 'app-ol-adaptor-railroads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorRailroadsComponent implements Adaptor {
  // 👇 convert a Railroad to a Landmark
  adapt(railroad: RailroadProperties): LandmarkProperties[] {
    const base = landmarkStyles['railroad'];
    return base.properties.map((props) => ({
      ...props,
      fontColor:
        props.fontColor === '--map-railroad-active-color' && !railroad.active
          ? '--map-railroad-inactive-color'
          : props.fontColor,
      name: props.fontColor ? railroad.name : null,
      strokeColor:
        props.strokeColor === '--map-railroad-active-color' && !railroad.active
          ? '--map-railroad-inactive-color'
          : props.strokeColor
    }));
  }
}
