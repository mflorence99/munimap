import { RootPage } from '../root/page';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { OLControlAbstractParcelsLegendComponent } from '@lib/ol/ol-control-abstractparcelslegend';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/common';
import { ParcelProperties } from '@lib/common';
import { ParcelsState } from '@lib/state/parcels';
import { Select } from '@ngxs/store';
import { Signal } from '@angular/core';

import { colorOfAPDVDExcluded } from '@lib/ol/ol-apdvd2';
import { colorOfAPDVDIncluded } from '@lib/ol/ol-apdvd2';
import { inject } from '@angular/core';
import { isAPDVDExcluded } from '@lib/ol/ol-apdvd2';
import { isAPDVDIncluded } from '@lib/ol/ol-apdvd2';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-legend',
  template: `
    <app-sink
      #sink
      [mapState]="root.map$ | async"
      [parcelCoding]="root.parcelCoding$ | async" />

    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'map']" size="2x"></fa-icon>
      </figure>
      <p class="title">Legend</p>

      <!-- 🔥 all this for APDVD hack! -->

      <p class="subtitle">
        @if (sink.mapState.id === 'apdvd') {
          APDVD District
        } @else {
          Color-coded parcel {{ sink.parcelCoding }}
        }
      </p>
    </header>

    <table class="form legend">
      <tbody>
        <tr>
          <th></th>
          <th>
            @if (sink.parcelCoding === 'conformity') {
              <div>Smaller than</div>
            }
          </th>
          <th>#Lots</th>
          <th>Acres</th>
        </tr>

        <!-- 🔥 all this for APDVD hack! -->

        @if (sink.mapState.id === 'apdvd') {
          @if (countOfIncluded) {
            <tr>
              <td class="apdvd">
                <figure
                  [style.backgroundColor]="
                    'rgba(' + colorOfAPDVDIncluded + ', 0.25)'
                  "
                  class="key"></figure>
              </td>
              <td class="desc">Lots added to district</td>
              <td class="count">
                {{ countOfIncluded | number: '1.0-0' }}
              </td>
              <td class="count">
                {{ areaOfIncluded | number: '1.0-0' }}
              </td>
              <td></td>
            </tr>
          }

          @if (countOfExcluded) {
            <tr>
              <td class="apdvd">
                <figure
                  [style.backgroundColor]="
                    'rgba(' + colorOfAPDVDExcluded + ', 0.25)'
                  "
                  class="key"></figure>
              </td>
              <td class="desc">Lots excluded from district</td>
              <td class="count">
                {{ countOfExcluded | number: '1.0-0' }}
              </td>
              <td class="count">
                {{ areaOfExcluded | number: '1.0-0' }}
              </td>
              <td></td>
            </tr>
          }
        } @else {
          <!-- 🔥 return to regular programming! -->

          @switch (sink.parcelCoding) {
            <!-- 📦 CONFORMITY -->

            @case ('conformity') {
              @for (conformity of conformities; track conformity) {
                @if (countByConformity[conformity[0]] > 0) {
                  <tr>
                    <td class="conformity">
                      <figure
                        [style.backgroundColor]="
                          'rgba(var(--map-parcel-fill-c' +
                          quantizeConformingArea(conformity[1]) +
                          '), 0.5)'
                        "
                        class="key"></figure>
                    </td>
                    <td class="desc">{{ conformity[0] }}</td>
                    <td class="count">
                      {{ countByConformity[conformity[0]] | number: '1.0-0' }}
                    </td>
                    <td class="count">
                      {{ areaByConformity[conformity[0]] | number: '1.0-0' }}
                    </td>
                    <td></td>
                  </tr>
                }
              }
            }

            <!-- 📦 OWNERSHIP -->

            @case ('ownership') {
              @for (
                ownership of parcelPropertiesOwnership | keyvalue;
                track ownership.value
              ) {
                @if (countByOwnership[ownership.key] > 0) {
                  <tr>
                    <td class="ownership">
                      <figure
                        [style.backgroundColor]="
                          'rgba(var(--map-parcel-fill-o' +
                          ownership.key +
                          '), 0.5)'
                        "
                        class="key"></figure>
                    </td>
                    <td class="desc">{{ ownership.value }}</td>
                    <td class="count">
                      {{ countByOwnership[ownership.key] | number: '1.0-0' }}
                    </td>
                    <td class="count">
                      {{ areaByOwnership[ownership.key] | number: '1.0-0' }}
                    </td>
                    <td></td>
                  </tr>
                }
              }
            }

            <!-- 📦 TOPOGRAPHY -->

            @case ('topography') {
              @for (
                usage of parcelPropertiesUsage | keyvalue;
                track usage.value
              ) {
                @if (
                  ['500', '501', '502'].includes(usage.key) &&
                  countByUsage[usage.key] > 0
                ) {
                  <tr>
                    <td class="usage">
                      <figure
                        [style.backgroundColor]="
                          'rgba(var(--map-parcel-fill-u' + usage.key + '), 0.5)'
                        "
                        class="key"></figure>
                    </td>
                    <td class="desc">{{ usage.value }}</td>
                    <td class="count">
                      {{ countByUsage[usage.key] | number: '1.0-0' }}
                    </td>
                    <td class="count">
                      {{ areaByUsage[usage.key] | number: '1.0-0' }}
                    </td>
                    <td></td>
                  </tr>
                }
              }
            }

            <!-- 🔥 USAGE and HISTORY (a hack!) -->

            @default {
              @for (
                usage of parcelPropertiesUsage | keyvalue;
                track usage.value
              ) {
                @if (countByUsage[usage.key] > 0) {
                  <tr>
                    <td class="usage">
                      <figure
                        [style.backgroundColor]="
                          'rgba(var(--map-parcel-fill-u' + usage.key + '), 0.5)'
                        "
                        class="key"></figure>
                    </td>
                    <td class="desc">{{ usage.value }}</td>
                    <td class="count">
                      {{ countByUsage[usage.key] | number: '1.0-0' }}
                    </td>
                    <td class="count">
                      {{ areaByUsage[usage.key] | number: '1.0-0' }}
                    </td>
                    <td></td>
                  </tr>
                }
                @if (usage.key === '190') {
                  <tr>
                    <td class="use" colspan="4">
                      <article class="keys">
                        @for (
                          use of parcelPropertiesUse | keyvalue;
                          track use.value
                        ) {
                          <!-- 🔥 TEMPORARY - WASHINGTON ONLY -->
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
            }
          }
        }

        <tr>
          <td colspan="4"></td>
        </tr>

        <tr>
          <td class="des" colspan="4">
            <article class="keys">
              DES

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
        </tr>

        <tr>
          <td colspan="4"></td>
        </tr>

        <tr>
          <td class="help">
            <fa-icon [icon]="['fas', 'question-circle']" size="2x"></fa-icon>
          </td>
          <td class="desc" colspan="3">
            <a href="mailto:munimap.helpdesk@gmail.com" target="_blank">
              munimap.helpdesk&#64;gmail.com
            </a>
          </td>
        </tr>
      </tbody>
    </table>

    <ng-container></ng-container>
  `,
  styles: [
    `
      .legend {
        border-collapse: collapse;
        width: 100%;

        td,
        th {
          padding: 0.25rem;
        }

        th {
          font-weight: bold;
          text-transform: uppercase;
        }

        .count {
          text-align: right;
        }

        .des {
          .keys {
            display: grid;
            font-size: smaller;
            gap: 0.5rem;
            grid-template-columns: 2rem auto auto;

            .key {
              align-items: center;
              display: grid;
              gap: 0.5rem;
              grid-template-columns: auto 1fr;
              white-space: nowrap;

              .icon {
                height: 1rem;
                width: 1rem;
              }
            }
          }
        }

        .desc {
          overflow: hidden;
          position: relative;
          white-space: nowrap;
          width: 100%;
        }

        .apdvd,
        .conformity,
        .ownership,
        .usage {
          .key {
            border: 1px dashed var(--mat-blue-gray-300);
            height: 1.5rem;
            position: relative;
            width: 2rem;

            &::before {
              background-color: white;
              content: '';
              height: 100%;
              position: absolute;
              width: 100%;
              z-index: -1;
            }
          }
        }

        .use {
          .keys {
            display: grid;
            font-size: smaller;
            gap: 0.5rem;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto auto;
            padding: 0.5rem 1rem;

            .key {
              display: grid;
              gap: 0.5rem;
              grid-template-columns: auto 1fr;
              white-space: nowrap;

              .icon {
                height: 1.25rem;
                width: 1.25rem;
              }
            }
          }
        }
      }
    `
  ]
})
export class ParcelsLegendComponent
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
  printing: Signal<boolean>;
  root = inject(RootPage);
  state: Signal<string>;
  title: Signal<string>;

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
    this.onInit();
  }

  override resetCountersImpl(): void {
    this.areaOfExcluded = 0;
    this.areaOfIncluded = 0;
    this.countOfExcluded = 0;
    this.countOfIncluded = 0;
  }
}
