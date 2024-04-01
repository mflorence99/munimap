import { DestroyService } from '../services/destroy';
import { Legend } from './ol-control-abstractparcelslegend';
import { MapableComponent } from './ol-mapable';
import { OLControlAbstractParcelsLegendComponent } from './ol-control-abstractparcelslegend';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../common';
import { ParcelProperties } from '../common';
import { ParcelsState } from '../state/parcels';

import { colorOfAPDVDExcluded } from './ol-apdvd2';
import { colorOfAPDVDIncluded } from './ol-apdvd2';
import { isAPDVDExcluded } from './ol-apdvd2';
import { isAPDVDIncluded } from './ol-apdvd2';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
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
      class="legend ol-legend ol-unselectable ol-control">
      <header class="header">
        <h1 class="title()">{{ title() }}</h1>
        <h2 class="subtitle">December 9, 2023</h2>
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
          <tr>
            <td class="usage">
              <figure
                [style.backgroundColor]="
                  'rgba(' + colorOfAPDVDIncluded + ', 0.25)'
                "
                class="key"></figure>
            </td>
            <td class="desc">Lots added to district</td>
            <td class="numeric">{{ countOfIncluded | number: '1.0-0' }}</td>
            <td class="numeric">{{ areaOfIncluded | number: '1.0-0' }}</td>
          </tr>

          <tr>
            <td class="usage">
              <figure
                [style.backgroundColor]="
                  'rgba(' + colorOfAPDVDExcluded + ', 0.25)'
                "
                class="key"></figure>
            </td>
            <td class="desc">Lots excluded from district</td>
            <td class="numeric">{{ countOfExcluded | number: '1.0-0' }}</td>
            <td class="numeric">{{ areaOfExcluded | number: '1.0-0' }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  `
})
export class OLControlAPDVDLegendComponent
  extends OLControlAbstractParcelsLegendComponent
  implements OnInit
{
  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  areaOfExcluded: number;
  areaOfIncluded: number;
  colorOfAPDVDExcluded = colorOfAPDVDExcluded;
  colorOfAPDVDIncluded = colorOfAPDVDIncluded;
  countOfExcluded: number;
  countOfIncluded: number;
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
    if (isAPDVDExcluded(props)) {
      this.areaOfExcluded += props.area;
      this.countOfExcluded += 1;
    }
    if (isAPDVDIncluded(props)) {
      this.areaOfIncluded += props.area;
      this.countOfIncluded += 1;
    }
  }

  ngOnInit(): void {
    this.olControl = new Legend({ element: this.legend().nativeElement });
    this.olControl.setProperties({ component: this }, true);
    this.onInit();
  }

  override resetCountersImpl(): void {
    this.areaOfExcluded = 0;
    this.areaOfIncluded = 0;
    this.countOfExcluded = 0;
    this.countOfIncluded = 0;
  }
}
