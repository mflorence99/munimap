import { OLPopupDPWPropertiesComponent } from './ol-popup-dpwproperties';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-culvertproperties',
  templateUrl: './ol-popup-dpwproperties-impl.html',
  styleUrls: ['../ol-popup-abstractproperties.scss']
})
export class OLPopupCulvertPropertiesComponent {
  @Input() properties: any;

  schema = [
    ['Diameter', 'diameter', 'inches'],
    ['Length', 'length', 'feet'],
    ['Count', 'count', 'x'],
    ['Material', 'material'],
    ['Condition', 'condition'],
    ['Headwall', 'headwall'],
    ['Flood Hazard', 'floodHazard'],
    ['Year Re/built', 'year']
  ];

  constructor(public container: OLPopupDPWPropertiesComponent) {}
}
