import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLScaleLine from 'ol/control/ScaleLine';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlScaleLineComponent)
    }
  ],
  selector: 'app-ol-control-scaleline',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLControlScaleLineComponent implements Mapable, OnInit {
  @Input() bar: boolean;

  @Input() dpi: number;

  @Input() minWidth: number;

  olControl: OLScaleLine;

  @Input() steps: number;

  constructor(private map: OLMapComponent) {}

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    this.olControl = new OLScaleLine({
      bar: this.bar,
      dpi: this.dpi,
      className: this.bar ? 'ol-scaleline-bar' : 'ol-scaleline-line',
      minWidth: this.minWidth,
      steps: this.steps,
      text: false,
      units: 'us'
    });
  }
}
