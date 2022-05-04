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
      useExisting: forwardRef(() => OLAdaptorFloodHazardsComponent)
    }
  ],
  selector: 'app-ol-adaptor-floodhazards',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorFloodHazardsComponent implements Adaptor {
  @Input() floodHazardWidth = 36 /* 👈 feet */;

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fontFeet: this.floodHazardWidth,
        fontStyle: 'bold',
        iconColor: '--map-floodhazard-icon-color',
        iconOpacity: 1,
        iconOutline: true,
        iconOutlineColor: '--map-floodhazard-line-color',
        iconSymbol: '\uf024' /* 👈 flag */,
        // 👉 flood hazard can be co-located with a bridge
        //    or a stream crossing
        textOffsetFeet: [this.floodHazardWidth, -this.floodHazardWidth]
      })
    ];
  }

  // 👇 tweak style when hovering
  adaptWhenHovering(): LandmarkProperties[] {
    const hovering = this.adapt()[0];
    hovering.iconColor = '--map-landmark-hover';
    hovering.iconOpacity = 1;
    return [hovering];
  }

  // 👇 tweak style when selected
  adaptWhenSelected(): LandmarkProperties[] {
    const selected = this.adapt()[0];
    selected.iconColor = '--map-landmark-select';
    selected.iconOpacity = 1;
    return [selected];
  }
}
