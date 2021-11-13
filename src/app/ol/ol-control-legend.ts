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

import { forwardRef } from '@angular/core';

class Legend extends OLControl {
  constructor(opts: any) {
    super(opts);
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlLegendComponent)
    }
  ],
  selector: 'app-ol-control-legend',
  templateUrl: './ol-control-legend.html',
  styleUrls: ['./ol-control-legend.scss']
})
export class OLControlLegendComponent implements Mapable, OnInit {
  @ViewChild('legend', { static: true }) legend: ElementRef;

  olControl: OLControl;

  @Input() printing: boolean;
  @Input() title: string;

  constructor(private map: OLMapComponent) {}

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    this.olControl = new Legend({ element: this.legend.nativeElement });
  }
}
