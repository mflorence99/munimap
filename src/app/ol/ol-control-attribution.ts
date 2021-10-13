import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import OLAttribution from 'ol/control/Attribution';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-attribution',
  template: '<ng-content></ng-content>',
  styles: []
})
export class OLControlAttributionComponent implements AfterContentInit {
  olControl: OLAttribution;

  constructor(private map: OLMapComponent) {
    this.olControl = new OLAttribution();
  }

  ngAfterContentInit(): void {
    this.map.olMap.addControl(this.olControl);
  }
}
