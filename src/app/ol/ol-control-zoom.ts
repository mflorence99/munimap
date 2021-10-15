import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLZoom from 'ol/control/Zoom';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlZoomComponent)
    }
  ],
  selector: 'app-ol-control-zoom',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLControlZoomComponent implements Mapable {
  olControl: OLZoom;

  constructor(private map: OLMapComponent) {
    this.olControl = new OLZoom();
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }
}
