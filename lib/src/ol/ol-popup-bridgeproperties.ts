import { OLPopupDPWPropertiesComponent } from './ol-popup-dpwproperties';
import { Schema } from './ol-popup-dpwproperties';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { inject } from '@angular/core';
import { input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-bridgeproperties',
  templateUrl: './ol-popup-dpwproperties-impl.html'
})
export class OLPopupBridgePropertiesComponent {
  container = inject(OLPopupDPWPropertiesComponent);
  properties = input<any>();

  schema: Schema = [
    ['Location', 'FACILITY'],
    ['', 'LOCATION'],
    ['Bridge Condition', 'RYGB'],
    ['Bridge Type', 'BRIDGE_TYPE_DESCR'],
    ['Bridge Span', 'MAXSPAN_FEET'],
    ['Year Built', 'YEARBUILT'],
    ['Year Rebuilt', 'YEARRECON'],
    ['Owner', 'OWNER']
  ];
}
