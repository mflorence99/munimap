import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLAttribution from 'ol/control/Attribution';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlAttributionComponent)
    }
  ],
  selector: 'app-ol-control-attribution',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLControlAttributionComponent implements Mapable {
  @Input()
  set collapsible(state: boolean) {
    this.olControl.setCollapsible(state);
  }

  olControl: OLAttribution;

  constructor(private map: OLMapComponent) {
    this.olControl = new OLAttribution({ collapsible: false });
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }
}
