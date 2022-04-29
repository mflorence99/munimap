import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Control as OLControl } from 'ol/control';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { forwardRef } from '@angular/core';

// 🔥 this control is designed ONLY to be printed on the map

class Credits extends OLControl {
  constructor(opts: any) {
    super(opts);
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlCreditsComponent)
    }
  ],
  selector: 'app-ol-control-credits',
  templateUrl: './ol-control-credits.html',
  styleUrls: ['./ol-control-credits.scss']
})
export class OLControlCreditsComponent implements Mapable, OnInit {
  attributions: string[] = [];

  // 👇 set the position proportional to the map size
  get bottom(): number {
    const element = this.map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor;
  }

  @ViewChild('creditsRef', { static: true }) creditsRef: ElementRef;

  // 👇 set the font size proportional to the map size
  get fontSize(): number {
    const element = this.map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor;
  }

  // 👇 set the height proportional to the map size
  get height(): number {
    return this.fontSize * 1.25;
  }

  now = Date.now();

  olControl: OLControl;

  // 👇 set the position proportional to the map size
  get right(): number {
    return this.bottom;
  }

  @Input() scaleFactor = 150;

  constructor(private cdf: ChangeDetectorRef, private map: OLMapComponent) {}

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  mapUpdated(): void {
    const raw = this.map.olMap
      .getLayers()
      .getArray()
      .map(
        (layer: any): string[] => layer.getSource().getAttributions()?.() ?? []
      )
      .flat();
    this.attributions = Array.from(new Set(raw));
    this.cdf.markForCheck();
  }

  ngOnInit(): void {
    this.olControl = new Credits({ element: this.creditsRef.nativeElement });
  }
}
