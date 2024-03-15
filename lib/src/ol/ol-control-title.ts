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
import { inject } from '@angular/core';

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
  template: `
    <article
      #titleRef
      [ngStyle]="{ 'top.px': top }"
      class="title ol-unselectable">
      <header
        [ngClass]="{ contrast: showTitleContrast }"
        [ngStyle]="{ 'fontSize.px': fontSize }"
        class="header">
        {{ title }}
      </header>
    </article>
  `,
  styles: [
    `
      .title {
        left: 0;
        position: absolute;
        right: 0;

        .header {
          color: var(--background-color);
          font-family: 'Bentham Regular', sans-serif;
          font-weight: bold;
          text-align: center;
          -webkit-text-stroke-color: var(--text-color);
          -webkit-text-stroke-width: 1px;

          &.contrast {
            color: var(--text-color);
            -webkit-text-stroke-color: var(--background-color);
          }
        }
      }
    `
  ]
})
export class OLControlTitleComponent implements Mapable, OnInit {
  @Input() scaleFactor = 50;

  @Input() showTitleContrast: boolean;

  @Input() title: string;

  @ViewChild('titleRef', { static: true }) titleRef: ElementRef;

  olControl: OLControl;

  #map = inject(OLMapComponent);

  // 👇 set the font size proportional to the map size
  get fontSize(): number {
    const element = this.#map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor;
  }

  // 👇 set the position proportional to the map size
  get top(): number {
    const element = this.#map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor;
  }

  addToMap(): void {
    this.#map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    this.olControl = new Title({ element: this.titleRef.nativeElement });
    this.olControl.setProperties({ component: this }, true);
  }
}
