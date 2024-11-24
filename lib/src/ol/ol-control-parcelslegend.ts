import { DestroyService } from "../services/destroy";
import { Legend } from "./ol-control-abstractparcelslegend";
import { OLControlAbstractParcelsLegendComponent } from "./ol-control-abstractparcelslegend";
import { OLMapComponent } from "./ol-map";
import { MapableComponent } from "./ol-mapable";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { ElementRef } from "@angular/core";
import { OnInit } from "@angular/core";

import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";
import { viewChild } from "@angular/core";
import { area } from "@turf/area";
import { convertArea } from "@turf/helpers";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlParcelsLegendComponent)
    },
    DestroyService
  ],
  selector: "app-ol-control-parcelslegend",
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
            @if (areaByUsage[usage.key]) {
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
            @if (usage.key === '190') {
              <tr>
                <td></td>
                <td class="use">
                  <article class="keys">
                    @for (
                      use of parcelPropertiesUse | keyvalue;
                      track use.value
                    ) {
                      <!-- 🔥 TEMPORARY -- WASHINGTON ONLY -->
                      @if (
                        [
                          'CUFL',
                          'CUMH',
                          'CUMW',
                          'CUUH',
                          'CUUW',
                          'CUWL'
                        ].includes(use.key)
                      ) {
                        <figure class="key">
                          <img
                            [src]="'assets/legend/' + use.key + '.png'"
                            class="icon" />
                          <figcaption>{{ use.value }}</figcaption>
                        </figure>
                      }
                    }
                  </article>
                </td>
                <td></td>
              </tr>
            }
          }

          <tr>
            <td></td>
            <td class="desc">Lakes, ponds, rights of way</td>
            <td class="numeric">
              {{ areaOfTown - areaOfParcels | number: '1.0-0' }}
            </td>
          </tr>

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
  standalone: false
})
export class OLControlParcelsLegendComponent
  extends OLControlAbstractParcelsLegendComponent
  implements OnInit
{
  areaOfTown: number;
  county = input<string>();
  id = input<string>();
  legend = viewChild<ElementRef>("legend");
  printing = input<boolean>();
  state = input<string>();
  title = input<string>();

  #map = inject(OLMapComponent);

  override addToMap(): void {
    this.#map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    this.areaOfTown = convertArea(
      area(this.#map.boundary()),
      "meters",
      "acres"
    );
    this.olControl = new Legend({ element: this.legend().nativeElement });
    this.olControl.setProperties({ component: this }, true);
    this.onInit();
  }
}
