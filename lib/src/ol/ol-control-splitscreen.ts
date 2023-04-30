import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChild } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLSwipe from 'ol-ext/control/Swipe';

// ⚠️ this is a very simple implementation that assumes one layer
//    on the left and one on the right, and those layers never change
//    good job because that's what we need for now

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlSplitScreenComponent)
    }
  ],
  selector: 'app-ol-control-splitscreen',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLControlSplitScreenComponent
  implements AfterContentInit, Mapable
{
  @ContentChild('left', { static: true }) onLeft: any;
  @ContentChild('right', { static: true }) onRight: any;

  olControl: OLSwipe;

  constructor(private map: OLMapComponent) {
    this.olControl = new OLSwipe();
    this.olControl.setProperties({ component: this }, true);
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngAfterContentInit(): void {
    this.olControl.addLayer(this.onLeft.olLayer, false);
    this.olControl.addLayer(this.onRight.olLayer, true);
  }
}
