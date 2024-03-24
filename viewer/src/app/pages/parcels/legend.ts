import { ChangeDetectionStrategy } from '@angular/core';
import { ColorCodeState } from '@lib/state/colorcode';
import { ColorCodeStateModel } from '@lib/state/colorcode';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { OLControlAbstractParcelsLegendComponent } from '@lib/ol/ol-control-abstractparcelslegend';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/common';
import { ParcelsState } from '@lib/state/parcels';
import { Select } from '@ngxs/store';
import { Signal } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-legend',
  template: `
    @if (colorCode$ | async; as colorCode) {
      <header class="header">
        <figure class="icon">
          <fa-icon [icon]="['fad', 'map']" size="2x"></fa-icon>
        </figure>
        <p class="title">Legend</p>
        <p class="subtitle">Color-coded parcel {{ colorCode.strategy }}</p>
      </header>

      <table class="form legend">
        <tbody>
          <tr>
            <th></th>
            <th>
              @if (colorCode.strategy === 'conformity') {
                <div>Smaller than</div>
              }
            </th>
            <th>#Lots</th>
            <th>Acres</th>
          </tr>

          @switch (colorCode.strategy) {
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

            <!-- 📦 USAGE -->

            @case ('usage') {
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
    }
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
  ],
  styleUrls: ['../../../../../lib/css/sidebar.scss']
})
export class ParcelsLegendComponent
  extends OLControlAbstractParcelsLegendComponent
  implements OnInit
{
  @Select(ColorCodeState) colorCode$: Observable<ColorCodeStateModel>;
  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  county: Signal<string>;
  id: Signal<string>;
  printing: Signal<boolean>;
  state: Signal<string>;
  title: Signal<string>;

  ngOnInit(): void {
    this.onInit();
  }
}
