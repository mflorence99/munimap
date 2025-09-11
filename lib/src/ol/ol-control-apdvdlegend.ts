import { DestroyService } from '../services/destroy';
import { Legend } from './ol-control-abstractparcelslegend';
import { MapableComponent } from './ol-mapable';
import { OLControlAbstractParcelsLegendComponent } from './ol-control-abstractparcelslegend';
import { OLMapComponent } from './ol-map';
import { ParcelProperties } from '../common';

import { colorOfAPDVDExisting } from './ol-apdvd3';
import { colorOfAPDVDProposed } from './ol-apdvd3';
import { isAPDVDExisting } from './ol-apdvd3';
import { isAPDVDProposed } from './ol-apdvd3';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { Signal } from '@angular/core';

import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { viewChild } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlAPDVDLegendComponent)
    },
    DestroyService
  ],
  selector: 'app-ol-control-apdvdlegend',
  template: `
    <article
      #legend
      [ngClass]="{
        'ol-legend-print': printing(),
        'ol-legend-screen': !printing()
      }"
      class="legend ol-legend ol-unselectable ol-control app-ol-control-apdvdlegend">
      <header class="header">
        <h1 class="title">{{ title() }}</h1>
        <h2 class="subtitle">October, 2025</h2>
      </header>

      <table class="areaByUsage">
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th class="numeric">Lots</th>
            <th class="numeric">Acres</th>
          </tr>
        </thead>

        <tbody>
          @if (countOfProposed) {
            <tr>
              <td class="usage">
                <figure
                  [style.backgroundColor]="
                    'rgba(' + colorOfAPDVDProposed + ', 0.25)'
                  "
                  class="key"></figure>
              </td>
              <td class="desc">Proposed APDVD lots</td>
              <td class="numeric">{{ countOfProposed | number: '1.0-0' }}</td>
              <td class="numeric">{{ areaOfProposed | number: '1.0-0' }}</td>
            </tr>
          }

          @if (countOfExisting) {
            <tr>
              <td class="usage">
                <figure
                  [style.backgroundColor]="
                    'rgba(' + colorOfAPDVDExisting + ', 0.25)'
                  "
                  class="key"></figure>
              </td>
              <td class="desc">Existing APDVD lots</td>
              <td class="numeric">{{ countOfExisting | number: '1.0-0' }}</td>
              <td class="numeric">{{ areaOfExisting | number: '1.0-0' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </article>
  `,
  standalone: false
})
export class OLControlAPDVDLegendComponent
  extends OLControlAbstractParcelsLegendComponent
  implements OnInit
{
  areaOfExisting: number;
  areaOfProposed: number;
  colorOfAPDVDExisting = colorOfAPDVDExisting;
  colorOfAPDVDProposed = colorOfAPDVDProposed;
  countOfExisting: number;
  countOfProposed: number;
  county: Signal<string>;
  id: Signal<string>;
  legend = viewChild<ElementRef>('legend');
  printing = input<boolean>();
  state: Signal<string>;
  title = input<string>();

  #map = inject(OLMapComponent);

  override addToMap(): void {
    this.#map.olMap.addControl(this.olControl);
  }

  override aggregateParcelImpl(props: ParcelProperties): void {
    if (isAPDVDExisting(props)) {
      this.areaOfExisting += props.area;
      this.countOfExisting += 1;
    }
    if (isAPDVDProposed(props)) {
      this.areaOfProposed += props.area;
      this.countOfProposed += 1;
    }
  }

  ngOnInit(): void {
    this.olControl = new Legend({ element: this.legend().nativeElement });
    this.olControl.setProperties({ component: this }, true);
    this.onInit();
  }

  override resetCountersImpl(): void {
    this.areaOfExisting = 0;
    this.areaOfProposed = 0;
    this.countOfExisting = 0;
    this.countOfProposed = 0;
  }
}
