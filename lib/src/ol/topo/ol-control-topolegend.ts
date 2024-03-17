import { DestroyService } from '../../services/destroy';
import { Legend } from '../ol-control-abstractparcelslegend';
import { MapableComponent } from '../ol-mapable';
import { OLControlAbstractParcelsLegendComponent } from '../ol-control-abstractparcelslegend';
import { OLMapComponent } from '../ol-map';
import { Parcel } from '../../common';
import { ParcelsState } from '../../state/parcels';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { convertArea } from '@turf/helpers';
import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

import area from '@turf/area';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlTopoLegendComponent)
    },
    DestroyService
  ],
  selector: 'app-ol-control-topolegend',

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
        <h2 class="subtitle">{{ county() }} Co</h2>
        <h2 class="subtitle">{{ state() }}</h2>
        <h3 class="link">{{ id() }}.munimap.online</h3>
      </header>

      <table class="areaByUsage">
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th class="numeric">Acres</th>
          </tr>
        </thead>

        <tbody>
          @for (usage of parcelPropertiesUsage | keyvalue; track usage.value) {
            @if (
              ['500', '501', '502'].includes(usage.key) &&
              areaByUsage[usage.key]
            ) {
              <tr>
                <td class="usage">
                  <figure
                    [style.backgroundColor]="
                      'rgba(var(--map-parcel-fill-u' + usage.key + '), 0.25)'
                    "
                    class="key"></figure>
                </td>
                <td class="desc">{{ usage.value }}</td>
                <td class="numeric">
                  {{ areaByUsage[usage.key] | number: '1.0-0' }}
                </td>
              </tr>
            }
          }

          <tr>
            <td></td>
            <td class="des">
              <article class="keys">
                <figure class="key">
                  <img [src]="'assets/legend/floodplain.png'" class="icon" />
                  <figcaption>FEMA Floodplain</figcaption>
                </figure>

                <figure class="key">
                  <img [src]="'assets/legend/CUWL.png'" class="icon" />
                  <figcaption>Wetland</figcaption>
                </figure>
              </article>
            </td>
            <td></td>
          </tr>

          <tr class="total">
            <td></td>
            <td class="desc">Total</td>
            <td class="numeric">{{ areaOfTown | number: '1.0-0' }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  `,
  styleUrls: ['../ol-control-abstractparcelslegend.scss']
})
export class OLControlTopoLegendComponent
  extends OLControlAbstractParcelsLegendComponent
  implements OnInit
{
  @ViewChild('legend', { static: true }) legend: ElementRef;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  areaOfTown: number;
  county = input<string>();
  id = input<string>();
  printing = input<boolean>();
  state = input<string>();
  title = input<string>();

  #map = inject(OLMapComponent);

  override addToMap(): void {
    this.#map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    this.areaOfTown = convertArea(area(this.#map.boundary), 'meters', 'acres');
    this.olControl = new Legend({ element: this.legend.nativeElement });
    this.olControl.setProperties({ component: this }, true);
    this.onInit();
  }
}
