import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import OLZoomToExtent from 'ol/control/ZoomToExtent';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-zoom2extent',
  templateUrl: './ol-control-zoom2extent.html',
  styleUrls: ['./ol-control-zoom2extent.scss']
})
export class OLControlZoomToExtentComponent {
  olControl: OLZoomToExtent;

  constructor(public map: OLMapComponent) {}
}
