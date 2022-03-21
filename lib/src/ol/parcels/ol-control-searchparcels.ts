import { DestroyService } from '../../services/destroy';
import { Feature } from '../../geojson';
import { Features } from '../../geojson';
import { GeoJSONService } from '../../services/geojson';
import { OLInteractionSelectParcelsComponent } from './ol-interaction-selectparcels';
import { OLMapComponent } from '../ol-map';
import { Parcel } from '../../geojson';
import { ParcelID } from '../../geojson';
import { ParcelsState } from '../../state/parcels';
import { Searcher } from '../ol-searcher';
import { SearcherComponent } from '../ol-searcher';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Subject } from 'rxjs';

import { combineLatest } from 'rxjs';
import { forwardRef } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';
import fuzzysort from 'fuzzysort';

interface Override {
  address?: string;
  bbox?: GeoJSON.BBox;
  owner?: string;
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
  selector: 'app-ol-control-searchparcels',
  templateUrl: './ol-control-searchparcels.html',
  styleUrls: ['./ol-control-searchparcels.scss']
})
export class OLControlSearchParcelsComponent implements OnInit, Searcher {
  #geojson$ = new Subject<Features>();

  #overridesByID: Record<ParcelID, Override> = {};

  #searchTargets = [];

  @Input() fuzzyMaxResults = 100;
  @Input() fuzzyMinLength = 3;
  @Input() fuzzyThreshold = -10000;

  matches: string[] = [];

  @Input() matchesMaxVisible = 20;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  searchablesByAddress: Record<string, Feature[]> = {};
  searchablesByID: Record<ParcelID, Feature[]> = {};
  searchablesByOwner: Record<string, Feature[]> = {};

  constructor(
    private destroy$: DestroyService,
    private geoJSON: GeoJSONService,
    private map: OLMapComponent,
    private parcelsState: ParcelsState,
    private route: ActivatedRoute
  ) {}

  #filterRemovedFeatures(geojson: Features, parcels: Parcel[]): void {
    const removed = this.parcelsState.parcelsRemoved(parcels);
    geojson.features = geojson.features.filter(
      (feature) => !removed.has(feature.id)
    );
  }

  #groupSearchablesByProperty(
    searchables: Feature[],
    prop: string
  ): Record<string, Feature[]> {
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
    this.geoJSON
      .loadByIndex(this.route, this.map.path, 'searchables')
      .subscribe((geojson: Features) => this.#geojson$.next(geojson));
  }

  #handleStreams$(): void {
    // 👇 we need to merge the incoming geojson with the latest parcels
    combineLatest([this.#geojson$, this.parcels$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([original, parcels]) => {
        // 👉 take a copy of the geojson before we change it
        const geojson = copy(original);
        // 👉 build search data structures
        this.#insertAddedFeatures(geojson, parcels);
        this.#filterRemovedFeatures(geojson, parcels);
        this.#overridesByID = this.#makeOverridesByID(parcels);
        this.#searchTargets = this.#makeSearchTargets(geojson.features);
        this.searchablesByAddress = this.#groupSearchablesByProperty(
          geojson.features,
          'address'
        );
        this.searchablesByID = this.#groupSearchablesByProperty(
          geojson.features,
          'id'
        );
        this.searchablesByOwner = this.#groupSearchablesByProperty(
          geojson.features,
          'owner'
        );
      });
  }

  #insertAddedFeatures(geojson: Features, parcels: Parcel[]): void {
    const added = this.parcelsState.parcelsAdded(parcels);
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

  #makeOverridesByID(parcels: Parcel[]): Record<ParcelID, Override> {
    const modified = this.parcelsState.parcelsModified(parcels);
    // 👉 merge all the modifications into a single override
    return Object.keys(modified).reduce((acc, id) => {
      const override: Override = {};
      modified[id].forEach((parcel) => {
        // 👉 awkward: bbox doesn't quite follow pattern
        if (parcel.bbox !== undefined && override.bbox === undefined)
          override.bbox = parcel.bbox;
        const props = parcel.properties;
        if (props) {
          ['address', 'id', 'owner'].forEach((prop) => {
            if (props[prop] !== undefined && override[prop] === undefined)
              override[prop] = props[prop];
          });
        }
      });
      acc[id] = override;
      return acc;
    }, {});
  }

  #makeSearchTargets(searchables: Feature[]): any[] {
    const keys = new Set<ParcelID>();
    searchables.forEach((searchable) => {
      const props = searchable.properties;
      const override = this.#overridesByID[searchable.id];
      if (override?.address) keys.add(override.address);
      else if (props.address) keys.add(props.address);
      if (override?.owner) keys.add(override.owner);
      else if (props.owner) keys.add(props.owner);
      keys.add(props.id);
    });
    return Array.from(keys).map((key) => fuzzysort.prepare(`${key}`));
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
      const ids = searchables.map((searchable) => searchable.id).join(', ');
      console.log(`%cFound parcels`, 'color: indianred', `[${ids}]`);
      // 👉 there HAS to be a selector, or else we couldn't be here
      const selector = this.map.selector as OLInteractionSelectParcelsComponent;
      selector.selectParcels(
        searchables.map((searchable) => {
          const override = this.#overridesByID[searchable.id];
          if (override?.bbox) return { ...searchable, bbox: override.bbox };
          else return searchable;
        })
      );
    } else if (searchFor.length > this.fuzzyMinLength) {
      // 👉 no hit, but enough characters to go for a fuzzy match
      this.matches = fuzzysort
        .go(searchFor, this.#searchTargets, {
          limit: this.fuzzyMaxResults,
          threshold: this.fuzzyThreshold
        })
        .map((fuzzy) => fuzzy.target)
        .sort();
    } else if (searchFor.length === 0) {
      // 👉 reset everything when the search string is cleared
      this.matches = [];
    }
    return searchFor;
  }

  trackByMatch(ix: number, match: string): string {
    return match;
  }
}
