import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLAttribution from 'ol/control/Attribution';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlCreditsComponent)
    }
  ],
  selector: 'app-ol-control-credits',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLControlCreditsComponent implements Mapable {
  olControl: OLAttribution;

  constructor(private map: OLMapComponent) {
    this.olControl = new OLAttribution({
      className: 'ol-credits',
      collapsible: false
    });
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }
}
