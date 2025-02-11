import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';

import { contentChildren } from '@angular/core';
import { effect } from '@angular/core';
import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

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
  styles: [':host { display: none }'],
  standalone: false
})
export class OLControlGraticuleComponent implements Mapable, OnInit {
  borderPixels = input<number>();
  margin = input<number>();
  maxZoom = input<number>();
  olControl: OLGraticule;
  spacing = input<number>();
  step = input(0.01);
  stepCoord = input(1);
  stylers = contentChildren<Styler>(StylerComponent, { descendants: true });

  #map = inject(OLMapComponent);

  constructor() {
    effect(() => {
      // 👇 ol-ext/control/graticule is special in that it can take
      //    only a single style, so in this logic, the last one wins
      this.stylers().forEach((styler) =>
        this.olControl.setStyle(styler.style())
      );
    });
  }

  addToMap(): void {
    // 🔥 due to special ngOnInit, this might be called
    //    out of sequence ???
    if (this.olControl) this.#map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    const dps = String(this.step()).split('.')[1].length;
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    this.olControl = new OLGraticule({
      borderWidth: this.borderPixels(),
      formatCoord: (coord: any): string => `${coord.toFixed(dps)}°`,
      margin: this.margin(),
      maxResolution: this.maxZoom()
        ? this.#map.olView.getResolutionForZoom(this.maxZoom())
        : undefined,
      spacing: this.spacing(),
      step: this.step(),
      stepCoord: this.stepCoord()
    });
    this.olControl.setProperties({ component: this }, true);
  }
}
