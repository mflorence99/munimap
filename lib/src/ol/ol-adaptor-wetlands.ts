import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';
import { OLFillPatternType } from './ol-styler';
import { WetlandProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorWetlandsComponent)
    }
  ],
  selector: 'app-ol-adaptor-wetlands',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorWetlandsComponent implements Adaptor {
  @Input() riverbank: OLFillPatternType = 'rocks';
  @Input() riverbankOpacity = 0.25;
  @Input() swamp: OLFillPatternType = 'swamp';
  @Input() swampOpacity = 0.5;

  // 👇 construct LandmarkProperties
  adapt(wetland: WetlandProperties): LandmarkProperties[] {
    switch (wetland.type) {
      case 'marsh':
        return [
          new LandmarkPropertiesClass({
            fillColor: '--map-wetland-swamp',
            fillOpacity: this.swampOpacity,
            fillPattern: this.swamp
          })
        ];
      case 'water':
        return [
          new LandmarkPropertiesClass({
            fillColor: '--map-waterbody-fill',
            fillOpacity: 1
          }),
          new LandmarkPropertiesClass({
            strokeColor: '--map-riverbank-rocks',
            strokeOpacity: this.riverbankOpacity,
            strokePattern: this.riverbank,
            strokePatternScale: 2,
            strokeStyle: 'solid',
            strokeWidth: 'thick'
          })
        ];
    }
  }
}
