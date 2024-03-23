import { OLPopupDPWPropertiesComponent } from './ol-popup-dpwproperties';
import { Schema } from './ol-popup-dpwproperties';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { inject } from '@angular/core';
import { input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-floodhazardproperties',
  templateUrl: './ol-popup-dpwproperties-impl.html',
  styleUrls: ['./ol-popup-abstractproperties.scss']
})
export class OLPopupFloodHazardPropertiesComponent {
  container = inject(OLPopupDPWPropertiesComponent);
  properties = input<any>();

  schema: Schema = [
    ['Location', 'Location'],
    ['Description', 'FloodDesc'],
    ['Flood Type', 'FloodType'],
    ['Issue', 'CrossIssue'],
    ['Previous Actions', 'MitAction'],
    ['Report Source', 'Source']
  ];
}
