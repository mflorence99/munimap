import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';
import { StreamCrossingProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorStreamCrossingsComponent)
    }
  ],
  selector: 'app-ol-adaptor-streamcrossings',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorStreamCrossingsComponent implements Adaptor {
  @Input() streamCrossingWidth = 36 /* 👈 feet */;

  // 👇 construct LandmarkProperties
  adapt(streamCrossing: StreamCrossingProperties): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fontColor: '--map-streamcrossing-line-color',
        fontFeet: this.streamCrossingWidth,
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: 'bold',
        iconColor: `--map-streamcrossing-${streamCrossing.condition}-icon-color`,
        iconOpacity: 1,
        iconOutline: true,
        iconOutlineColor: '--map-streamcrossing-line-color',
        iconSymbol: '\uf1ce' /* 👈 circle-notch */,
        name: streamCrossing.name,
        textAlign: 'center',
        textBaseline: 'bottom'
      })
    ];
  }
}
