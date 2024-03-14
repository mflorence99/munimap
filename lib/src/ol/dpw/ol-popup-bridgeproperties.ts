import { OLPopupDPWPropertiesComponent } from './ol-popup-dpwproperties';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-bridgeproperties',
  templateUrl: './ol-popup-dpwproperties-impl.html',
  styleUrls: ['../ol-popup-abstractproperties.scss']
})
export class OLPopupBridgePropertiesComponent {
  @Input() properties: any;

  container = inject(OLPopupDPWPropertiesComponent);

  schema = [
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
