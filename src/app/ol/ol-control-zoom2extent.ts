import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';
import { transformExtent } from 'ol/proj';

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
    const bbox = this.map.boundary.features[0].bbox;
    // 👉 TODO: ambient typings missing this
    const featureProjection = this.map.boundary['crs'].properties.name;
    this.olControl = new OLZoomToExtent({
      extent: transformExtent(bbox, featureProjection, this.map.projection)
    });
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }
}
