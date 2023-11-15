import { OLPopupDPWPropertiesComponent } from './ol-popup-dpwproperties';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-floodhazardproperties',
  templateUrl: './ol-popup-dpwproperties-impl.html',
  styleUrls: ['../ol-popup-abstractproperties.scss']
})
export class OLPopupFloodHazardPropertiesComponent {
  @Input() properties: any;

  schema = [
    ['Location', 'Location'],
    ['Description', 'FloodDesc'],
    ['Flood Type', 'FloodType'],
    ['Issue', 'CrossIssue'],
    ['Previous Actions', 'MitAction'],
    ['Report Source', 'Source']
  ];

  constructor(public container: OLPopupDPWPropertiesComponent) {}
}
