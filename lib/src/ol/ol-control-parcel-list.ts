import { Parcel } from "../common";
import { ParcelID } from "../common";
import { Parcels } from "../common";
import { DestroyService } from "../services/destroy";
import { GeoJSONService } from "../services/geojson";
import { MapState } from "../state/map";
import { ParcelsState } from "../state/parcels";
import { OLInteractionSelectParcelsComponent } from "./ol-interaction-selectparcels";
import { OLMapComponent } from "./ol-map";

import { isParcelStollen } from "../common";
import { parcelProperties } from "../common";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { OnInit } from "@angular/core";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { Subject } from "rxjs";

import { inject } from "@angular/core";
import { combineLatest } from "rxjs";
import { takeUntil } from "rxjs/operators";

import copy from "fast-copy";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-control-parcel-list",
  template: `
    <article class="control">
      <section #list class="list" [class.collapsed]="collapsed">

        <section class="simlist">
          @let listSize = parcels.length ? 1 : categories.length;

          @if (listSize === 1) {
            &#9660;
          }

          <select 
            (change)="onFilterCategory($any($event.target).value)"
            [size]="listSize"
            class="categories">
            @for (category of categories; track category[0]) {
              <option [value]="category[0]" class="category">
                {{ category[1] }}
              </option>
            }
          </select>
        </section>

        <aside class="wrapper">
          <table class="properties">

            <tbody>
              @for (parcel of parcels; track parcel.id; let ix = $index) {
                <tr>
                  <td class="index">{{ ix + 1 }}.</td>
                  <td>
                    <a (click)="onSelect(parcel)">{{ parcel.id }}</a>
                  </td>
                  <td class="address">{{ parcel.properties.address }}</td>
                </tr>
              }
            </tbody>

          </table>
        </aside>

      </section>

      <button (click)="toggleList()" mat-icon-button>
        <fa-icon [icon]="['fal', 'list-ol']" size="2x"></fa-icon>
      </button>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        pointer-events: auto;
      }

      @media (width <= 768px) {
        :host {
          display: none;
        }
      }
 
      .category {
        color: var(--text-color);
      }

      .categories {
        font-weight: bold;
      }

      .control {
        align-items: center;
        display: flex;
        position: relative;
      }

      .list {
        background-color: rgba(var(--rgb-gray-100), 0.75);
        bottom: -0.25rem;
        opacity: 1;
        padding: 0.5rem;
        position: absolute;
        right: 4rem;
        transition: opacity 0.25s ease-in-out;
      }

      .list.collapsed {
        opacity: 0;
        pointer-events: none;
      }

      .properties {
        border-collapse: collapse;
        font-size: smaller;
        width: 100%;

        td {
          padding-right: 0.25rem;
          white-space: nowrap;
        }

        td.address {
          width: 100%;
        }

        td.index {
          font-weight: bold;
          text-align: right;
        }
      }

      .simlist {
        display: flex;
      }

      .wrapper {
        max-height: 480px;
        overflow-x: hidden;
        overflow-y: auto;
        width: 320px;
      }
   `
  ],
  standalone: false
})
export class OLControlParcelListComponent implements OnInit {
  categories = [
    ["deed", "Deeded Properties"],
    ["300", "Town Properties"],
    ["400", "State Properties"],
    ["500", "State Parks"],
    ["501", "Town Forests"],
    ["502", "Conservation Lands"]
  ];
  collapsed = true;
  parcels: Parcel[] = [];
  parcels$: Observable<Parcel[]>;
  ready = false;

  #category$ = new Subject<string>();
  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #geoJSON = inject(GeoJSONService);
  #geojson$ = new Subject<Parcels>();
  #map = inject(OLMapComponent);
  #mapState = inject(MapState);
  #overridesByID: Record<ParcelID, Parcel> = {};
  #parcelsState = inject(ParcelsState);
  #store = inject(Store);

  constructor() {
    this.parcels$ = this.#store.select(ParcelsState.parcels);
  }

  ngOnInit(): void {}

  onFilterCategory(category: string): void {
    this.#category$.next(category);
  }

  onSelect(parcel: Parcel): void {
    // 👉 the selector MAY not be present and may not be for parcels
    const selector =
      this.#map.selector() as OLInteractionSelectParcelsComponent;
    selector?.selectParcels?.([parcel]);
  }

  toggleList(): void {
    this.collapsed = !this.collapsed;
    if (!this.collapsed) {
      if (!this.ready) {
        this.#handleGeoJSON$();
        this.#handleStreams$();
        this.ready = true;
      }
    }
  }

  // 👇 stolen parcels don't count!
  #filterRemovedFeatures(geojson: Parcels, parcels: Parcel[]): void {
    const removed = this.#parcelsState.parcelsRemoved(parcels);
    geojson.features = geojson.features.filter(
      (feature) => !removed.has(feature.id) && !isParcelStollen(feature.id)
    );
  }

  #handleGeoJSON$(): void {
    this.#geoJSON
      .loadByIndex(this.#mapState.currentMap().path, "parcels")
      .subscribe((geojson: Parcels) => this.#geojson$.next(geojson));
  }

  #handleStreams$(): void {
    // 👇 we need to merge the incoming geojson with the latest parcels
    combineLatest([this.#geojson$, this.parcels$, this.#category$])
      .pipe(takeUntil(this.#destroy$))
      .subscribe(([original, parcels, category]) => {
        // 👉 take a copy of the geojson before we change it
        const geojson = copy(original);
        // 👉 build data structures
        this.#insertAddedFeatures(geojson, parcels);
        this.#filterRemovedFeatures(geojson, parcels);
        this.#overridesByID = this.#makeOverridesByID(parcels);
        console.log(this.#overridesByID);
        this.parcels = <any>geojson.features
          .map((feature) => {
            const props = feature.properties;
            const override = this.#overridesByID[feature.id];
            return {
              id: feature.id,
              bbox: override?.bbox ?? feature.bbox,
              properties: { ...props, ...override }
            };
          })
          .filter((feature) => {
            if (category !== "deed")
              return feature.properties?.usage === category;
            else
              return (
                feature.properties.owner?.endsWith(" TC DEED") ||
                feature.properties.owner?.endsWith(" TC - DEED")
              );
          });
        this.#cdf.markForCheck();
      });
  }

  #insertAddedFeatures(geojson: Parcels, parcels: Parcel[]): void {
    const added = this.#parcelsState.parcelsAdded(parcels);
    // 👉 insert a model into the geojson (will be overwritten)
    added.forEach((id) => {
      geojson.features.push({
        geometry: undefined,
        id: id,
        properties: {},
        type: "Feature"
      });
    });
  }

  #makeOverridesByID(parcels: Parcel[]): Record<ParcelID, Parcel> {
    const modified = this.#parcelsState.parcelsModified(parcels);
    // 👉 merge all the modifications into a single override
    return Object.keys(modified).reduce((acc, id) => {
      const override: any = {};
      modified[id].forEach((parcel) => {
        // 👉 awkward: bbox doesn't quite follow pattern
        if (parcel.bbox !== undefined && override.bbox === undefined)
          override.bbox = parcel.bbox;
        const props = parcel.properties;
        if (props) {
          parcelProperties.forEach((prop) => {
            if (props[prop] !== undefined && override[prop] === undefined)
              override[prop] = props[prop];
          });
        }
      });
      acc[id] = override;
      return acc;
    }, {});
  }
}
