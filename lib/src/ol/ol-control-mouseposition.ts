import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';

import OLMousePosition from 'ol/control/MousePosition';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlMousePositionComponent)
    }
  ],
  selector: 'app-ol-control-mouseposition',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLControlMousePositionComponent implements Mapable {
  olControl: OLMousePosition;

  #map = inject(OLMapComponent);

  constructor() {
    this.olControl = new OLMousePosition({
      className: 'ol-control-mouseposition',
      projection: this.#map.featureProjection
    });
    this.olControl.setProperties({ component: this }, true);
  }

  addToMap(): void {
    this.#map.olMap.addControl(this.olControl);
  }
}
