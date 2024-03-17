import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Control as OLControl } from 'ol/control';
import { ElementRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { convertLength } from '@turf/helpers';
import { forwardRef } from '@angular/core';
import { getDistance } from 'ol/sphere';
import { inject } from '@angular/core';
import { input } from '@angular/core';

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

  template: `
    <article
      #barRef
      [ngStyle]="{ 'bottom.px': bottom, 'gap.px': height / 4, 'left.px': left }"
      class="scalebar ol-unselectable">
      <div class="annotations" [ngStyle]="{ 'marginLeft.px': -cxUnit / 2 }">
        @for (
          unit of numUnits + 1 | times;
          track unit;
          let first = $first;
          let last = $last
        ) {
          <div
            [class.contrast]="showScaleContrast()"
            [class.first]="first"
            [class.last]="last"
            [ngStyle]="{
              'fontSize.px': fontSize,
              'height.px': height,
              'width.px': cxUnit
            }"
            class="annotation">
            {{ unit * ftUnit }}'
          </div>
        }
      </div>
      <div class="units" [ngStyle]="{ 'width.px': cxWidth }">
        @for (
          unit of numUnits | times;
          track unit;
          let white = $odd;
          let black = $even
        ) {
          <div
            [class.black]="black"
            [class.white]="white"
            [ngStyle]="{ 'height.px': height, 'width.px': cxUnit }"
            class="unit"></div>
        }
      </div>
    </article>
  `,
  styles: [
    `
      .scalebar {
        color: var(--background-color);
        display: grid;
        grid-template-rows: auto auto;
        position: absolute;

        .annotations {
          display: flex;

          .annotation {
            text-align: center;
            visibility: hidden;

            &.contrast {
              color: var(--text-color);
              -webkit-text-stroke-color: var(--background-color);
            }
          }

          .annotation.first,
          .annotation.last {
            visibility: visible;
          }
        }

        .units {
          border: 1px solid var(--mat-gray-900);
          display: flex;

          .unit.black {
            background-color: var(--mat-gray-900);
          }

          .unit.white {
            background-color: var(--mat-gray-50);
          }
        }
      }
    `
  ]
})
export class OLControlScaleBarComponent implements Mapable, OnInit {
  @ViewChild('barRef', { static: true }) barRef: ElementRef;

  cxUnit: number;
  cxWidth: number;
  ftUnit: number;
  numUnits: number;
  olControl: OLControl;
  scaleFactor = input(150);
  showScaleContrast = input<boolean>();

  #map = inject(OLMapComponent);

  // 👇 set the position proportional to the map size
  get bottom(): number {
    const element = this.#map.olMap.getTargetElement();
    return (element.clientHeight / this.scaleFactor()) * 4;
  }

  // 👇 set the font size proportional to the map size
  get fontSize(): number {
    const element = this.#map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor();
  }

  // 👇 set the height proportional to the map size
  get height(): number {
    return this.fontSize;
  }

  // 👇 set the position proportional to the map size
  get left(): number {
    return this.bottom;
  }

  addToMap(): void {
    this.#map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    this.olControl = new Scalebar({ element: this.barRef.nativeElement });
    this.olControl.setProperties({ component: this }, true);
    this.#calculateMetrics();
  }

  #calculateMetrics(): void {
    const [minX, minY, maxX] = this.#map.bbox();
    const numFeet = convertLength(
      getDistance([minX, minY], [maxX, minY]),
      'meters',
      'feet'
    );
    this.ftUnit = Math.pow(10, Math.floor(numFeet).toString().length - 2);
    // 🔥 force 10 units for now
    this.numUnits = 10; // Math.min(10, Math.round(numFeet / 4 / this.ftUnit));
    const numPixels = this.#map.olMap.getSize()[0];
    const cxFoot = numPixels / numFeet;
    this.cxUnit = this.ftUnit * cxFoot;
    this.cxWidth = this.cxUnit * this.numUnits;
  }
}
