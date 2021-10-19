import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Options as OLZoomToExtentOptions } from 'ol/control/ZoomToExtent';

import { forwardRef } from '@angular/core';

import OLZoomToExtent from 'ol/control/ZoomToExtent';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlZoomToExtentComponent)
    }
  ],
  selector: 'app-ol-control-zoom2extent',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLControlZoomToExtentComponent implements Mapable {
  olControl: OLZoomToExtent;

  constructor(private map: OLMapComponent) {
    this.olControl = new ZoomToExtentExtended(this.map, {
      extent: this.map.boundaryExtent
    });
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }
}

// 👇 OL's ZoomToExtent does not trigger any events from the View
//    to indicate that the center or zoom has changed, but we can fix that
//    thanks to OL's excellent architecture!

class ZoomToExtentExtended extends OLZoomToExtent {
  constructor(private map: OLMapComponent, options: OLZoomToExtentOptions) {
    super(options);
  }

  handleZoomToExtent(): void {
    super.handleZoomToExtent();
    this.map.onChange();
  }
}
