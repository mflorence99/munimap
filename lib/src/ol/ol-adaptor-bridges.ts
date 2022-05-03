import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { BridgeProperties } from '../common';
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
      useExisting: forwardRef(() => OLAdaptorBridgesComponent)
    }
  ],
  selector: 'app-ol-adaptor-bridges',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorBridgesComponent implements Adaptor {
  @Input() bridgeWidth = 48 /* 👈 feet */;

  // 👇 construct LandmarkProperties
  adapt(bridge: BridgeProperties): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fontColor: '--map-bridge-line-color',
        fontFeet: this.bridgeWidth,
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: 'bold',
        iconColor: `--map-bridge-${bridge.rygb}-icon-color`,
        iconOutline: true,
        iconOutlineColor: '--map-bridge-line-color',
        iconOpacity: 1,
        iconSymbol: '\uf00d' /* 👈 times */,
        name: 'Bridge',
        textAlign: 'center',
        textBaseline: 'bottom'
      })
    ];
  }
}
