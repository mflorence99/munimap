import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';
import { StylerComponent } from './ol-styler';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { QueryList } from '@angular/core';

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
export class OLControlGraticuleComponent
  implements AfterContentInit, Mapable, OnInit
{
  @Input() borderPixels: number;
  @Input() margin: number;
  @Input() maxZoom: number;
  @Input() spacing: number;
  @Input() step = 0.01;
  @Input() stepCoord = 1;

  @ContentChildren(StylerComponent, { descendants: true })
  stylers$: QueryList<any>;

  olControl: OLGraticule;

  constructor(private map: OLMapComponent) {}

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  // 👇 ol-ext/control/graticule is special in that it can take only a single
  //    style, so in this logic, the last one wins

  ngAfterContentInit(): void {
    this.stylers$.forEach((styler) => this.olControl.setStyle(styler.style()));
  }

  ngOnInit(): void {
    const dps = String(this.step).split('.')[1].length;
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    this.olControl = new OLGraticule({
      borderWidth: this.borderPixels,
      formatCoord: (coord: any): string => `${coord.toFixed(dps)}°`,
      margin: this.margin,
      maxResolution: this.maxZoom
        ? this.map.olView.getResolutionForZoom(this.maxZoom)
        : undefined,
      spacing: this.spacing,
      step: this.step,
      stepCoord: this.stepCoord
    });
    this.olControl.setProperties({ component: this }, true);
  }
}
