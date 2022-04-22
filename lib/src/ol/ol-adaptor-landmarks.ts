import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

export type FilterFunction = (name: string) => boolean;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorLandmarksComponent)
    }
  ],
  selector: 'app-ol-adaptor-landmarks',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorLandmarksComponent implements Adaptor {
  // 👇 pass thru LandmarkProperties
  adapt(landmark: LandmarkProperties): LandmarkProperties[] {
    return [landmark];
  }

  // 👇 tweak LandmarkProperties for selection
  adaptWhenSelected(landmark: LandmarkProperties): LandmarkProperties[] {
    const selected = { ...landmark };
    selected.strokeColor = '--map-landmark-select';
    if (!(selected.strokeFeet && selected.strokePixels && selected.strokeWidth))
      selected.strokeWidth = 'thick';
    return [selected];
  }
}
