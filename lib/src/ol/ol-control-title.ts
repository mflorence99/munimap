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

// 🔥 this control is designed ONLY to be printed on the map

class Title extends OLControl {
  constructor(opts: any) {
    super(opts);
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlTitleComponent)
    }
  ],
  selector: 'app-ol-control-title',
  templateUrl: './ol-control-title.html',
  styleUrls: ['./ol-control-title.scss']
})
export class OLControlTitleComponent implements Mapable, OnInit {
  // 👇 set the font size proportional to the map size
  get fontSize(): number {
    const element = this.map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor;
  }

  olControl: OLControl;

  @Input() scaleFactor = 50;

  @Input() showTitleContrast: boolean;

  @Input() title: string;

  @ViewChild('titleRef', { static: true }) titleRef: ElementRef;

  // 👇 set the position proportional to the map size
  get top(): number {
    const element = this.map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor;
  }

  constructor(private map: OLMapComponent) {}

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    this.olControl = new Title({ element: this.titleRef.nativeElement });
  }
}
