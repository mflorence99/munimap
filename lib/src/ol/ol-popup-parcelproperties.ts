import { Parcel } from "../common";
import { ParcelID } from "../common";
import { ParcelProperties } from "../common";
import { OLInteractionSelectParcelsComponent } from "./ol-interaction-selectparcels";
import { OLMapComponent } from "./ol-map";
import { OLPopupSelectionComponent } from "./ol-popup-selection";

import { parcelPropertiesUsage } from "../common";
import { parcelPropertiesUse } from "../common";

import { ChangeDetectionStrategy } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { Component } from "@angular/core";
import { ElementRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

import { inject } from "@angular/core";
import { input } from "@angular/core";
import { viewChild } from "@angular/core";
import { outputToObservable } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";

import OLFeature from "ol/Feature";

// 👇 we can't use the normal DestroyService protocol here
//    as snackbar popups don't have a standard lifecycle
//    when created via openFromTemplate

interface Abutter {
  address: string;
  addressOfOwner: string;
  id: ParcelID;
  owner: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-popup-parcelproperties",
  template: `
    <button (click)="onClose()" class="closer" mat-icon-button>
      <fa-icon [icon]="['fas', 'times']" size="lg"></fa-icon>
    </button>

    @if (canClipboard()) {
      <button (click)="onClipboard()" class="clipboard" mat-icon-button>
        <fa-icon [icon]="['far', 'clipboard']" size="lg"></fa-icon>
      </button>
    }

    <section
      #tables
      [class.splitHorizontally]="splitHorizontally"
      [class.splitVertically]="splitVertically"
      class="tables">
      @if (properties.length > 0) {
        <aside class="wrapper">
          <table class="properties">
            <thead>
              <tr>
                <th></th>
                @for (property of properties; track property) {
                  <th>
                    {{ property.id }}
                    @if (
                      ['N-U', 'N-V', 'N-W'].includes(property.neighborhood) &&
                      ['110', '120'].includes(property.usage)
                    ) {
                      <mark>VACANT</mark>
                    }
                  </th>
                }
              </tr>
            </thead>

            <tbody>
              @if (sameAddress) {
                <tr>
                  <td>Address</td>
                  <td [attr.colspan]="properties.length">
                    {{ properties[0].address }}
                  </td>
                </tr>
              }
              @if (sameOwner) {
                <tr>
                  <td>Owner</td>
                  <td [attr.colspan]="properties.length">
                    {{ properties[0].owner }}
                  </td>
                </tr>
              }
              @if (sameOwner && properties[0].addressOfOwner) {
                <tr>
                  <td></td>
                  <td [attr.colspan]="properties.length" class="wrappable">
                    {{ properties[0].addressOfOwner }}
                  </td>
                </tr>
              }
              @if (sameUsage) {
                <tr>
                  <td>Land use</td>
                  <td [attr.colspan]="properties.length">
                    {{ parcelPropertiesUsage[properties[0].usage] }}
                    @if (properties[0].usage === '190') {
                      <span>
                        &nbsp;&mdash;&nbsp;{{
                          parcelPropertiesUse[properties[0].use]
                        }}
                      </span>
                    }
                  </td>
                </tr>
              }

              <tr>
                <td>Area</td>
                @for (property of properties; track property) {
                  <td>{{ property.area | number: '1.0-2' }} ac</td>
                }
              </tr>

              <tr>
                <td>Building</td>
                @for (property of properties; track property) {
                  <td>
                    {{
                      property.building$ | currency: 'USD' : 'symbol' : '1.0-0'
                    }}
                  </td>
                }
              </tr>

              <tr>
                <td>Land</td>
                @for (property of properties; track property) {
                  <td>
                    {{ property.land$ | currency: 'USD' : 'symbol' : '1.0-0' }}
                  </td>
                }
              </tr>

              <tr>
                <td>Other</td>
                @for (property of properties; track property) {
                  <td>
                    {{ property.other$ | currency: 'USD' : 'symbol' : '1.0-0' }}
                  </td>
                }
              </tr>

              <tr>
                <td>Total</td>
                @for (property of properties; track property) {
                  <td>
                    {{ property.taxed$ | currency: 'USD' : 'symbol' : '1.0-0' }}
                  </td>
                }
              </tr>

              <tr>
                <td></td>
                @for (property of properties; track property) {
                  <td>
                    <a [href]="googleLink(property)" target="_blank">
                      Google view
                    </a>
                  </td>
                }
              </tr>
            </tbody>
          </table>
        </aside>
      }
      @if (abutters.length > 0) {
        <aside class="wrapper">
          <table class="abutters">
            <thead>
              <tr>
                <th></th>
                <th>Abutters</th>
              </tr>
            </thead>

            <tbody>
              @for (abutter of abutters; track abutter) {
                <tr>
                  <td>
                    <a (click)="onSelect(abutter.id)">{{ abutter.id }}</a>
                  </td>
                  <td>{{ abutter.owner ?? abutter.address }}</td>
                </tr>
                @if (abutter.addressOfOwner) {
                  <tr>
                    <td></td>
                    <td class="wrappable">{{ abutter.addressOfOwner }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </aside>
      }
    </section>
  `,
  styles: [
    `
      .abutters,
      .properties {
        border-collapse: collapse;
        font-size: smaller;
        width: 100%;

        th {
          background-color: var(--mat-gray-900);
          border-bottom: 1px solid var(--mat-gray-500);
          font-weight: bold;
          position: sticky;
          text-align: left;
          top: 0;
          z-index: 1;
        }

        td,
        th {
          margin: 0;
          padding: 0;
          white-space: nowrap;
        }

        td.wrappable {
          max-width: 14rem;
          white-space: unset;
        }

        td:first-child,
        th:first-child {
          font-weight: bold;
          padding: 0 0.25rem 0 0;
          width: 4rem;
        }

        td:not(:first-child),
        th:not(:first-child) {
          border-left: 1px solid var(--mat-gray-500);
          padding: 0 0.25rem;
        }
      }

      .reference {
        color: var(--accent-color);
        cursor: pointer;
        font-size: large;
      }

      .tables {
        display: grid;
        width: 100%;

        &.splitHorizontally {
          grid-row-gap: 1rem;
          grid-template-columns: 1fr;
          grid-template-rows: auto auto;
        }

        &.splitVertically {
          grid-column-gap: 1rem;
          grid-template-columns: auto auto;
          grid-template-rows: 1fr;
        }
      }

      .wrapper {
        max-width: unset;
      }
    `,
  ],
})
export class OLPopupParcelPropertiesComponent {
  abutters: Abutter[] = [];
  maxNumProperties = input(3);
  parcelPropertiesUsage = parcelPropertiesUsage;
  parcelPropertiesUse = parcelPropertiesUse;
  properties: ParcelProperties[] = [];
  sameAddress: boolean;
  sameOwner: boolean;
  sameUsage: boolean;
  splitHorizontally = false;
  splitVertically = true;
  tables = viewChild<ElementRef>("tables");

  #cdf = inject(ChangeDetectorRef);
  #map = inject(OLMapComponent);
  #popper = inject(OLPopupSelectionComponent);
  #snackBar = inject(MatSnackBar);

  constructor() {
    // 👉 see above, no ngOnInit where we'd normally do this
    this.#handleAbuttersFound$();
    this.#handleFeaturesSelected$();
  }

  canClipboard(): boolean {
    return this.#popper.canClipboard();
  }

  // 👉 https://developers.google.com/maps/documentation/urls/get-started
  googleLink(property: ParcelProperties): string {
    const link = `https://www.google.com/maps/@?api=1&map_action=map&center=${
      property.centers[0][1]
    }%2C${property.centers[0][0]}&zoom=${Math.round(
      this.#map.olView.getZoom(),
    )}&basemap=satellite`;
    return link;
  }

  onClipboard(): void {
    this.#popper.toClipboard(this.tables());
  }

  onClose(): void {
    this.#snackBar.dismiss();
    // 👉 the selector MAY not be present and may not be for parcels
    const selector =
      this.#map.selector() as OLInteractionSelectParcelsComponent;
    selector?.unselectParcels?.();
  }

  onSelect(abutterID: ParcelID): void {
    // 👉 the selector MAY not be present and may not be for parcels
    const selector =
      this.#map.selector() as OLInteractionSelectParcelsComponent;
    selector?.reselectParcels?.([abutterID]);
  }

  sum(array: number[]): number {
    return array.reduce((acc, val) => acc + val);
  }

  #handleAbuttersFound$(): void {
    outputToObservable(this.#map.abuttersFound)
      .pipe(
        map((features: Parcel[]): Abutter[] =>
          features
            .map((feature) => ({
              address: feature.properties.address,
              addressOfOwner: feature.properties.addressOfOwner,
              id: feature.id,
              owner: feature.properties.owner,
            }))
            .sort((p, q) => String(p.id).localeCompare(String(q.id))),
        ),
        // 👉 only show abutters if there's room
        map((abutters: Abutter[]): Abutter[] =>
          window.innerWidth >= 480 ? abutters : [],
        ),
      )
      .subscribe((abutters: Abutter[]) => {
        this.abutters = abutters;
        this.#cdf.markForCheck();
      });
  }

  #handleFeaturesSelected$(): void {
    outputToObservable(this.#map.featuresSelected)
      .pipe(
        map((features: OLFeature<any>[]): ParcelProperties[] =>
          features.map((feature) => feature.getProperties()),
        ),
        // 👉 show only as many properties as there's room
        map((properties: ParcelProperties[]): ParcelProperties[] => {
          const numProperties = window.innerWidth / 240;
          return properties.slice(
            0,
            Math.min(properties.length, numProperties, this.maxNumProperties()),
          );
        }),
      )
      .subscribe((properties: ParcelProperties[]) => {
        this.properties = properties;
        if (this.properties.length === 0) this.onClose();
        else {
          this.sameAddress = this.properties.every(
            (property) => property.address === this.properties[0].address,
          );
          this.sameOwner = this.properties.every(
            (property) => property.owner === this.properties[0].owner,
          );
          this.sameUsage = this.properties.every(
            (property) =>
              property.usage === this.properties[0].usage &&
              property.use === this.properties[0].use,
          );
          // 👉 split depending on # of parcels
          this.splitHorizontally = this.properties.length > 1;
          this.splitVertically = this.properties.length === 1;
          this.#cdf.markForCheck();
        }
      });
  }
}
