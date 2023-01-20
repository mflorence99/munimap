import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Control as OLControl } from 'ol/control';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { convertLength } from '@turf/helpers';
import { forwardRef } from '@angular/core';
import { getDistance } from 'ol/sphere';

// 🔥 this control is designed ONLY to be printed on the map

class Scalebar extends OLControl {
  constructor(opts: any) {
    super(opts);
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlScaleBarComponent)
    }
  ],
  selector: 'app-ol-control-scalebar',
  templateUrl: './ol-control-scalebar.html',
  styleUrls: ['./ol-control-scalebar.scss']
})
export class OLControlScaleBarComponent implements Mapable, OnInit {
  @ViewChild('barRef', { static: true }) barRef: ElementRef;

  // 👇 set the position proportional to the map size
  get bottom(): number {
    const element = this.map.olMap.getTargetElement();
    return (element.clientHeight / this.scaleFactor) * 4;
  }

  cxUnit: number;
  cxWidth: number;

  // 👇 set the font size proportional to the map size
  get fontSize(): number {
    const element = this.map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor;
  }

  ftUnit: number;

  // 👇 set the height proportional to the map size
  get height(): number {
    return this.fontSize;
  }

  numUnits: number;

  olControl: OLControl;

  // 👇 set the position proportional to the map size
  get left(): number {
    return this.bottom;
  }

  @Input() scaleFactor = 150;

  @Input() showScaleContrast: boolean;

  constructor(private map: OLMapComponent) {}

  #calculateMetrics(): void {
    const [minX, minY, maxX] = this.map.bbox;
    const numFeet = convertLength(
      getDistance([minX, minY], [maxX, minY]),
      'meters',
      'feet'
    );
    this.ftUnit = Math.pow(10, Math.floor(numFeet).toString().length - 2);
    // 🔥 force 10 units for now
    this.numUnits = 10; // Math.min(10, Math.round(numFeet / 4 / this.ftUnit));
    const numPixels = this.map.olMap.getSize()[0];
    const cxFoot = numPixels / numFeet;
    this.cxUnit = this.ftUnit * cxFoot;
    this.cxWidth = this.cxUnit * this.numUnits;
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    this.olControl = new Scalebar({ element: this.barRef.nativeElement });
    this.olControl.setProperties({ component: this }, true);
    this.#calculateMetrics();
  }
}
