import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLGraticule from 'ol-ext/control/Graticule';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlGraticuleComponent)
    }
  ],
  selector: 'app-ol-control-graticule',
  template: '<ng-content></ng-content>',
  styles: [':host { display: block; visibility: hidden }']
})
export class OLControlGraticuleComponent implements Mapable {
  olControl: OLGraticule;

  constructor(private map: OLMapComponent) {
    this.olControl = new OLGraticule();
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }
}
