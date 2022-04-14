import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

import { forwardRef } from '@angular/core';
import { getDistance } from 'ol/sphere';

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
  olControl: OLScaleLine;

  @Input() printing: boolean;

  constructor(private map: OLMapComponent) {}

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    const [minX, minY, maxX, maxY] = this.map.bbox;
    const resolution = this.map.olView.getResolution();
    const px = getDistance([minX, maxY], [maxX, minY]) / resolution;
    // 👉 calculate print dimensions
    let minWidth, steps;
    if (this.printing) {
      const nominalStepWidth = 32;
      // 👉 20 steps, but at least a multiple of 10 at nominal width
      steps = Math.ceil(Math.min(20, Math.ceil(px / 320)) / 10) * 10;
      // 👉 nominally 10% of page, but at least wide enouigh for steps
      minWidth = Math.max(px / 10, steps * nominalStepWidth);
    }
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    this.olControl = new OLScaleLine({
      bar: this.printing,
      className: this.printing ? 'ol-scaleline-bar' : 'ol-scaleline-line',
      minWidth: minWidth,
      steps: steps,
      units: 'us'
    });
  }
}
