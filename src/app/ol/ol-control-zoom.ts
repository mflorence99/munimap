import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import OLZoom from 'ol/control/Zoom';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-zoom',
  template: '<ng-content></ng-content>',
  styles: []
})
export class OLControlZoomComponent implements AfterContentInit {
  olControl: OLZoom;

  constructor(private map: OLMapComponent) {
    this.olControl = new OLZoom();
  }

  ngAfterContentInit(): void {
    this.map.olMap.addControl(this.olControl);
  }
}
