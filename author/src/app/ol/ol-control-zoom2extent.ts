import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-zoom2extent',
  templateUrl: './ol-control-zoom2extent.html',
  styleUrls: ['./ol-control-zoom2extent.scss']
})
export class OLControlZoomToExtentComponent {
  constructor(private map: OLMapComponent) {}

  zoom2extent(): void {
    this.map.zoomToBounds();
  }
}
