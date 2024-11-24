import { Parcel } from "../common";
import { ParcelID } from "../common";
import { SearchableParcel } from "../common";
import { SearchableParcels } from "../common";
import { DestroyService } from "../services/destroy";
import { GeoJSONService } from "../services/geojson";
import { ParcelsState } from "../state/parcels";
import { OLInteractionSelectParcelsComponent } from "./ol-interaction-selectparcels";
import { OLMapComponent } from "./ol-map";
import { Searcher } from "./ol-searcher";
import { SearcherComponent } from "./ol-searcher";

import { isParcelStollen } from "../common";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { Subject } from "rxjs";

import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";
import { combineLatest } from "rxjs";
import { takeUntil } from "rxjs/operators";

import copy from "fast-copy";
import fuzzysort from "fuzzysort";

interface Override {
  address?: string;
  bbox?: GeoJSON.BBox;
  owner?: string;
}

interface SearchTarget {
  count: number;
  key: any;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: SearcherComponent,
      useExisting: forwardRef(() => OLControlSearchParcelsComponent)
    },
    DestroyService
  ],
  selector: "app-ol-control-searchparcels",
  template: `
    <article class="control">
      <fa-icon [icon]="['fas', 'search']"></fa-icon>

      <input
        #theSearcher
        (focus)="onSearch($any($event.srcElement).value)"
        (input)="onSearch($any($event.srcElement).value)"
        class="searcher"
        placeholder="Search by parcel, address or owner" />

      <button
        (click)="(theSearcher.value = '') || theSearcher.focus()"
        [ngStyle]="{ visibility: theSearcher.value ? 'visible' : 'hidden' }"
        mat-icon-button>
        <fa-icon [icon]="['fas', 'times']" class="closer"></fa-icon>
      </button>
    </article>

    <ul
      [class.hidden]="matches.length === 0 || !theSearcher.value"
      class="matcher">
      @for (match of matches; track match.key) {
        <li (click)="onSearch(match.key)" class="match">
          <div class="key">{{ match.key }}</div>
          @if (match.count > 1) {
            <div class="count">({{ match.count }})</div>
          }
        </li>
      }
    </ul>
  `,
  styles: [
    `
      :host {
        display: block;
        pointer-events: auto;
        position: relative;
      }

      .closer {
        cursor: pointer;
      }

      .control {
        align-items: center;
        background-color: rgba(var(--rgb-gray-100), 0.66);
        display: grid;
        gap: 0.5rem;
        grid-template-columns: auto 1fr auto;
        height: 3rem;
        max-width: 90vmin;
        padding: 0 0.5rem;
        position: absolute;
        right: 0;
        width: 30rem;
      }

      .matcher {
        background-color: rgba(var(--rgb-gray-100), 0.66);
        max-width: 90vmin;
        position: absolute;
        right: 0;
        top: 3.1rem;
        width: 24.5rem;

        &.hidden {
          display: none;
        }

        .match {
          color: var(--mat-gray-900);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          padding: 0.25rem;

          .count {
            font-size: smaller;
            font-style: italic;
          }
        }
      }

      .searcher {
        background-color: transparent;
        border: none;
        color: var(--mat-gray-900);
        font-size: 1rem;
        height: 100%;
      }
    `
  ],
  standalone: false
})
export class OLControlSearchParcelsComponent implements OnInit, Searcher {
  filterFn = input<(feature) => boolean>();
  fuzzyMaxResults = input(100);
  fuzzyMinLength = input(3);
  fuzzyThreshold = input(-10000);
  matches: SearchTarget[] = [];
  matchesMaxVisible = input(20);
  parcels$: Observable<Parcel[]>;
  searchablesByAddress: Record<string, SearchableParcel[]> = {};
  searchablesByID: Record<ParcelID, SearchableParcel[]> = {};
  searchablesByOwner: Record<string, SearchableParcel[]> = {};

  #destroy$ = inject(DestroyService);
  #geoJSON = inject(GeoJSONService);
  #geojson$ = new Subject<SearchableParcels>();
  #map = inject(OLMapComponent);
  #overridesByID: Record<ParcelID, Override> = {};
  #parcelsState = inject(ParcelsState);
  #searchTargets = [];
  #store = inject(Store);

  constructor() {
    this.parcels$ = this.#store.select(ParcelsState.parcels);
  }

  ngOnInit(): void {
    this.#handleGeoJSON$();
    this.#handleStreams$();
  }

  onSearch(str: string): string {
    const searchFor = str.toUpperCase();
    // 👉 let's see if we have a direct hit by ID, then address, then owner
    const searchables =
      this.searchablesByID[searchFor] ??
      this.searchablesByAddress[searchFor] ??
      this.searchablesByOwner[searchFor];
    if (searchables) {
      // 👉 we have a hit, tell the selector
      this.matches = [];
      const ids = searchables.map((searchable) => searchable.id).join(", ");
      console.log(`%cFound parcels`, "color: indianred", `[${ids}]`);
      // 👉 the selector MAY not be present
      const selector =
        this.#map.selector() as OLInteractionSelectParcelsComponent;
      selector?.selectParcels(
        searchables.map((searchable): any => {
          const override = this.#overridesByID[searchable.id];
          if (override?.bbox) return { ...searchable, bbox: override.bbox };
          else return searchable;
        })
      );
    } else if (searchFor.length > this.fuzzyMinLength()) {
      // 👉 no hit, but enough characters to go for a fuzzy match
      this.matches = fuzzysort
        .go(searchFor, this.#searchTargets, {
          key: "key",
          limit: this.fuzzyMaxResults(),
          threshold: this.fuzzyThreshold()
        })
        .map((fuzzy) => ({ count: fuzzy.obj.count, key: fuzzy.target }))
        .sort((p, q) => p.key.localeCompare(q.key));
    } else if (searchFor.length === 0) {
      // 👉 reset everything when the search string is cleared
      this.matches = [];
    }
    return searchFor;
  }

  #filterRemovedFeatures(geojson: SearchableParcels, parcels: Parcel[]): void {
    const removed = this.#parcelsState.parcelsRemoved(parcels);
    geojson.features = geojson.features.filter(
      (feature) => !removed.has(feature.id) && !isParcelStollen(feature.id)
    );
  }

  #groupSearchablesByProperty(
    searchables: SearchableParcel[],
    prop: string
  ): Record<string, any> {
    return searchables.reduce((acc, searchable) => {
      const props = searchable.properties;
      const override = this.#overridesByID[searchable.id];
      const property = override?.[prop] ?? props[prop];
      if (property) {
        if (!acc[property]) acc[property] = [searchable];
        else acc[property].push(searchable);
      }
      return acc;
    }, {});
  }

  // 👉 the idea behind "searchables" is to provide just enough data for
  //    parcels to be searched -- we do this because we MUST have ALL
  //    the data available -- so searchables are degenerate parcels with
  //    just bbox, address, owner and id

  #handleGeoJSON$(): void {
    this.#geoJSON
      .loadByIndex(this.#map.path(), "searchables")
      .subscribe((geojson: SearchableParcels) => this.#geojson$.next(geojson));
  }

  #handleStreams$(): void {
    // 👇 we need to merge the incoming geojson with the latest parcels
    combineLatest([this.#geojson$, this.parcels$])
      .pipe(takeUntil(this.#destroy$))
      .subscribe(([original, parcels]) => {
        // 👉 take a copy of the geojson before we change it
        const geojson = copy(original);
        // 👉 build search data structures
        this.#insertAddedFeatures(geojson, parcels);
        this.#filterRemovedFeatures(geojson, parcels);
        this.#overridesByID = this.#makeOverridesByID(parcels);
        this.#searchTargets = this.#makeSearchTargets(
          this.filterFn()
            ? geojson.features.filter(this.filterFn())
            : geojson.features
        );
        this.searchablesByAddress = this.#groupSearchablesByProperty(
          geojson.features,
          "address"
        );
        this.searchablesByID = this.#groupSearchablesByProperty(
          geojson.features,
          "id"
        );
        this.searchablesByOwner = this.#groupSearchablesByProperty(
          geojson.features,
          "owner"
        );
      });
  }

  #insertAddedFeatures(geojson: SearchableParcels, parcels: Parcel[]): void {
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

  #makeOverridesByID(parcels: Parcel[]): Record<ParcelID, Override> {
    const modified = this.#parcelsState.parcelsModified(parcels);
    // 👉 merge all the modifications into a single override
    return Object.keys(modified).reduce((acc, id) => {
      const override: Override = {};
      modified[id].forEach((parcel) => {
        // 👉 awkward: bbox doesn't quite follow pattern
        if (parcel.bbox !== undefined && override.bbox === undefined)
          override.bbox = parcel.bbox;
        const props = parcel.properties;
        if (props) {
          ["address", "id", "owner"].forEach((prop) => {
            if (props[prop] !== undefined && override[prop] === undefined)
              override[prop] = props[prop];
          });
        }
      });
      acc[id] = override;
      return acc;
    }, {});
  }

  #makeSearchTargets(searchables: SearchableParcel[]): SearchTarget[] {
    const counts: Record<string, number> = {};
    // 👇 how to accumulate counts
    const accum = (key: string): void => {
      const count = counts[key];
      counts[key] = count ? count + 1 : 1;
    };
    // 👇 accumulate counts
    searchables.forEach((searchable) => {
      const props = searchable.properties;
      const override = this.#overridesByID[searchable.id];
      if (override?.address) accum(override.address);
      else if (props.address) accum(props.address);
      if (override?.owner) accum(override.owner);
      else if (props.owner) accum(props.owner);
      accum(props.id as string);
    });
    return Object.keys(counts).map((key) => ({
      count: counts[key],
      key: fuzzysort.prepare(key)
    }));
  }
}
