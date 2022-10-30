import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';
import { OLStrokePatternType } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorStoneWallsComponent)
    }
  ],
  selector: 'app-ol-adaptor-stonewalls',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorStoneWallsComponent implements Adaptor {
  @Input() pattern: OLStrokePatternType = 'rocks';
  @Input() patternOpacity = 0.5;
  @Input() patternScale = 2;

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        strokeColor: '--map-stonewall-fill',
        strokeOpacity: this.patternOpacity,
        strokeStyle: 'solid',
        strokeWidth: 'thick',
        zIndex: 1
      }),
      new LandmarkPropertiesClass({
        strokeColor: '--map-stonewall-rocks',
        strokeOpacity: this.patternOpacity,
        strokePattern: this.pattern,
        strokePatternScale: this.patternScale,
        strokeStyle: 'solid',
        strokeWidth: 'medium',
        zIndex: 2
      })
    ];
  }
}
