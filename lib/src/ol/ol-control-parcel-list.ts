import { Parcel } from '../common';
import { ParcelID } from '../common';
import { Parcels } from '../common';
import { DestroyService } from '../services/destroy';
import { GeoJSONService } from '../services/geojson';
import { MapState } from '../state/map';
import { ParcelsState } from '../state/parcels';
import { OLInteractionSelectParcelsComponent } from './ol-interaction-selectparcels';
import { OLMapComponent } from './ol-map';

import { isParcelStollen } from '../common';
import { parcelProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';

import { inject } from '@angular/core';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-parcel-list',
  template: `
    <article class="control">
      <section #list class="list" [class.collapsed]="collapsed">

        <select 
          (change)="onFilterCategory($any($event.target).value)"
          class="categories">
          <option class="category" value="deed">Deeded Properties</option>
          <option class="category" value="300">Town Properties</option>
          <option class="category" value="400">State Properties</option>
          <option class="category" value="500">State Parks</option>
          <option class="category" value="501">Town Forests</option>
          <option class="category" value="502">Conservation Lands</option>
        </select>

        <aside class="wrapper">
          <table class="properties">

            <tbody>
              @for (parcel of parcels; track parcel.id) {
                <tr>
                  <td>
                    <a (click)="onSelect(parcel)">{{ parcel.id }}</a>
                  </td>
                  <td>{{ parcel.properties.address }}</td>
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
          white-space: nowrap;
        }
      }

      .wrapper {
        max-height: 480px;
        overflow-x: hidden;
        overflow-y: auto;
        width: 320px;
      }
   `
  ]
})
export class OLControlParcelListComponent implements OnInit {
  collapsed = true;
  parcels: Parcel[] = [];
  parcels$: Observable<Parcel[]>;

  #category$ = new BehaviorSubject<string>('deed');
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

  ngOnInit(): void {
    this.#handleGeoJSON$();
    this.#handleStreams$();
  }

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
      .loadByIndex(this.#mapState.currentMap().path, 'parcels')
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
            if (category !== 'deed')
              return feature.properties?.usage === category;
            else
              return (
                feature.properties.owner?.endsWith(' TC DEED') ||
                feature.properties.owner?.endsWith(' TC - DEED')
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
        type: 'Feature'
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
