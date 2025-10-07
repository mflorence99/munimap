import { RootPage } from '../root/page';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OLControlAbstractParcelsLegendComponent } from '@lib/ol/ol-control-abstractparcelslegend';
import { OnInit } from '@angular/core';
import { ParcelProperties } from '@lib/common';
import { Signal } from '@angular/core';

import { colorOfAPDVDExisting } from '@lib/ol/ol-apdvd3';
import { colorOfAPDVDProposed } from '@lib/ol/ol-apdvd3';
import { inject } from '@angular/core';
import { isAPDVDExisting } from '@lib/ol/ol-apdvd3';
import { isAPDVDProposed } from '@lib/ol/ol-apdvd3';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-legend',
  template: `
    @let sink =
      {
        accessibilityFilter: root.accessibilityFilter$ | async,
        mapState: root.mapState$ | async,
        parcelCoding: root.parcelCoding$ | async
      };

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
          @if (countOfProposed) {
            <tr>
              <td class="apdvd">
                <figure
                  [style.backgroundColor]="
                    'rgba(' + colorOfAPDVDProposed + ', 0.5)'
                  "
                  [style.filter]="sink.accessibilityFilter"
                  class="key"></figure>
              </td>
              <td class="desc">Expanded APDVD lots</td>
              <td class="count">
                {{ countOfProposed | number: '1.0-0' }}
              </td>
              <td class="count">
                {{ areaOfProposed | number: '1.0-0' }}
              </td>
              <td></td>
            </tr>
          }

          @if (countOfExisting) {
            <tr>
              <td class="apdvd">
                <figure
                  [style.backgroundColor]="
                    'rgba(' + colorOfAPDVDExisting + ', 0.5)'
                  "
                  [style.filter]="sink.accessibilityFilter"
                  class="key"></figure>
              </td>
              <td class="desc">Original APDVD lots</td>
              <td class="count">
                {{ countOfExisting | number: '1.0-0' }}
              </td>
              <td class="count">
                {{ areaOfExisting | number: '1.0-0' }}
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
                        [style.filter]="sink.accessibilityFilter"
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
                        [style.filter]="sink.accessibilityFilter"
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
                        [style.filter]="sink.accessibilityFilter"
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
                        [style.filter]="sink.accessibilityFilter"
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
                                class="icon"
                                role="none" />
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
                <img
                  [src]="'assets/legend/floodplain.png'"
                  role="none"
                  class="icon" />
                <figcaption>FEMA Floodplain</figcaption>
              </figure>

              <figure class="key">
                <img
                  [src]="'assets/legend/CUWL.png'"
                  role="none"
                  class="icon" />
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
            backdrop-filter: invert(1);
            border: 1px dashed var(--mat-blue-gray-300);
            height: 1.5rem;
            position: relative;
            width: 2rem;
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
  ],
  standalone: false
})
export class ParcelsLegendComponent
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
  printing: Signal<boolean>;
  root = inject(RootPage);
  state: Signal<string>;
  title: Signal<string>;

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
    this.onInit();
  }

  override resetCountersImpl(): void {
    this.areaOfExisting = 0;
    this.areaOfProposed = 0;
    this.countOfExisting = 0;
    this.countOfProposed = 0;
  }
}
