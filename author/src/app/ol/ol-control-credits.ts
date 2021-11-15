import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';

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
  template: `{{ now | date: 'longDate' }}&nbsp;|&nbsp;`,
  styles: [':host { display: none }']
})
export class OLControlCreditsComponent implements AfterViewInit, Mapable {
  now = Date.now();
  olControl: OLAttribution;

  constructor(private host: ElementRef, private map: OLMapComponent) {
    this.olControl = new OLAttribution({
      className: 'ol-credits',
      collapsible: false
    });
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const credits = document.querySelector('.ol-credits');
      credits?.prepend(this.host.nativeElement.innerText);
    }, 0);
  }
}