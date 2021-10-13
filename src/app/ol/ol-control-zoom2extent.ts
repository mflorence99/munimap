import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { transformExtent } from 'ol/proj';

import OLZoomToExtent from 'ol/control/ZoomToExtent';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-zoom2extent',
  template: '<ng-content></ng-content>',
  styles: []
})
export class OLControlZoomToExtentComponent implements AfterContentInit {
  olControl: OLZoomToExtent;

  constructor(private map: OLMapComponent) {
    // 👉 can't follow his pattern as no setExtent() API
    // this.olControl = new OLZoomToExtent();
  }

  ngAfterContentInit(): void {
    const bbox = this.map.boundary.features[0].bbox;
    // 👉 TODO: ambient typings missing this
    const featureProjection = this.map.boundary['crs'].properties.name;
    this.olControl = new OLZoomToExtent({
      extent: transformExtent(bbox, featureProjection, this.map.projection)
    });
    this.map.olMap.addControl(this.olControl);
  }
}
