import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

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
  styles: [':host { display: none }']
})
export class OLControlGraticuleComponent implements Mapable, OnInit {
  @Input() borderWidth: number;
  @Input() margin: number;
  @Input() maxZoom: number;

  olControl: OLGraticule;

  @Input() spacing: number;
  @Input() step = 0.01;
  @Input() stepCoord = 5;

  constructor(private map: OLMapComponent) {}

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    // 👉 we can't follow the normal convention and put this in the
    // constructor as there a few "set" methods
    this.olControl = new OLGraticule({
      borderWidth: this.borderWidth,
      // 🔥 make toFixed(2) a function of this.stepCoord
      formatCoord: (coord): string => `${coord.toFixed(2)}°`,
      margin: this.margin,
      maxResolution: this.maxZoom
        ? this.map.olView.getResolutionForZoom(this.maxZoom)
        : undefined,
      spacing: this.spacing,
      step: this.step,
      stepCoord: this.stepCoord
    });
  }

  setStyle(style: OLStyleComponent): void {
    this.olControl.setStyle(style.style());
  }
}
