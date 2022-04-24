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

  // 👇 tweak LandmarkProperties when hovering
  adaptWhenHovering(landmark: LandmarkProperties): LandmarkProperties[] {
    const hovering = { ...landmark };
    hovering.fontColor = '--map-landmark-hover';
    hovering.strokeColor = '--map-landmark-hover';
    hovering.strokeOpacity = 1;
    if (!(hovering.strokeFeet && hovering.strokePixels && hovering.strokeWidth))
      hovering.strokeWidth = 'medium';
    if (!hovering.strokeStyle) hovering.strokeStyle = 'solid';
    return [hovering];
  }

  // 👇 tweak LandmarkProperties when selected
  adaptWhenSelected(landmark: LandmarkProperties): LandmarkProperties[] {
    const selected = { ...landmark };
    selected.fontColor = '--map-landmark-select';
    selected.strokeColor = '--map-landmark-select';
    selected.strokeOpacity = 1;
    if (!(selected.strokeFeet && selected.strokePixels && selected.strokeWidth))
      selected.strokeWidth = 'medium';
    if (!selected.strokeStyle) selected.strokeStyle = 'solid';
    return [selected];
  }
}
