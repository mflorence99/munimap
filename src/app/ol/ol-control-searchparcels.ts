import { DestroyService } from '../services/destroy';
import { Feature } from '../common';
import { Features } from '../common';
import { GeoJSONService } from '../services/geojson';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../common';
import { ParcelID } from '../common';
import { ParcelsState } from '../state/parcels';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Subject } from 'rxjs';

import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';
import fuzzysort from 'fuzzysort';

type Override = {
  address: string;
  bbox: [number, number, number, number];
  owner: string;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-control-searchparcels',
  templateUrl: './ol-control-searchparcels.html',
  styleUrls: ['./ol-control-searchparcels.scss']
})
export class OLControlSearchParcelsComponent implements OnInit {
  #geojson$ = new Subject<Features>();

  #overridesByID: Record<string, Override> = {};

  #searchTargets = [];
  #searchablesByAddress: Record<string, Feature[]> = {};
  #searchablesByID: Record<string, Feature[]> = {};
  #searchablesByOwner: Record<string, Feature[]> = {};

  @Input() fuzzyMaxResults = 100;
  @Input() fuzzyMinLength = 3;
  @Input() fuzzyThreshold = -10000;

  matches: string[] = [];

  @Input() matchesMaxVisible = 20;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  constructor(
    private destroy$: DestroyService,
    private geoJSON: GeoJSONService,
    private map: OLMapComponent,
    private route: ActivatedRoute
  ) {}

  #filterRemovedFeatures(geojson: Features, parcels: Parcel[]): void {
    // 👉 remember that NULL resets a parcel override
    const removedHash = parcels.reduce((acc, parcel) => {
      if (acc[parcel.id] === undefined && parcel.removed !== undefined)
        acc[parcel.id] = parcel.removed;
      return acc;
    }, {});
    // 👉 now we have a list of IDs that must be removed
    const removedIDs = new Set<any>(
      Object.keys(removedHash).filter((key) => removedHash[key])
    );
    // 👉 remove them from the geojson
    geojson.features = geojson.features.filter(
      (feature) => !removedIDs.has(feature.id)
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
        this.#searchablesByAddress = this.#groupSearchablesByProperty(
          geojson.features,
          'address'
        );
        this.#searchablesByID = this.#groupSearchablesByProperty(
          geojson.features,
          'id'
        );
        this.#searchablesByOwner = this.#groupSearchablesByProperty(
          geojson.features,
          'owner'
        );
      });
  }

  #insertAddedFeatures(geojson: Features, parcels: Parcel[]): void {
    // 👉 remember that NULL resets a parcel override
    const addedHash = parcels.reduce((acc, parcel) => {
      if (acc[parcel.id] === undefined && parcel.added !== undefined)
        acc[parcel.id] = parcel.added;
      return acc;
    }, {});
    // 👉 now we have a list of IDs that must be added
    const addedIDs = new Set<any>(
      Object.keys(addedHash).filter((key) => addedHash[key])
    );
    // 👉 insert a model into the geojson (will be overwritten)
    addedIDs.forEach((addedID) => {
      geojson.features.push({
        geometry: undefined,
        id: addedID,
        properties: {},
        type: 'Feature'
      });
    });
  }

  // 👇 remember: parcels are in descending order by timestamp
  //    the first "defined" value wins
  //    null means no override, accept the original geojson
  #makeOverridesByID(parcels: Parcel[]): Record<string, Override> {
    return parcels.reduce((acc, parcel) => {
      if (!acc[parcel.id]) acc[parcel.id] = {};
      const override = acc[parcel.id];
      // 👉 awkward: bbox doesn't quite follow pattern
      if (parcel.bbox !== undefined && override.bbox === undefined)
        override.bbox = parcel.bbox;
      const props = parcel.properties;
      if (props) {
        if (props.address !== undefined && override.address === undefined)
          override.address = props.address;
        if (props.owner !== undefined && override.owner === undefined)
          override.owner = props.owner;
      }
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

  input(str: string): string {
    const searchFor = str.toUpperCase();
    // 👉 let's see if we have a direct hit by ID, then address, then owner
    const searchables =
      this.#searchablesByID[searchFor] ??
      this.#searchablesByAddress[searchFor] ??
      this.#searchablesByOwner[searchFor];
    if (searchables) {
      // 👉 we have a hit, tell the selector
      this.matches = [];
      const ids = searchables.map((searchable) => searchable.id).join(', ');
      console.log(`%cFound parcels`, 'color: indianred', `[${ids}]`);
      this.map.selector.selectParcels(
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

  maxMatcherSize(): number {
    // 👇 we need at least 2 entries to get the HTML <select>
    //    to behave properly
    return Math.max(2, Math.min(this.matches.length, this.matchesMaxVisible));
  }

  ngOnInit(): void {
    this.#handleGeoJSON$();
    this.#handleStreams$();
  }

  trackByMatch(ix: number, match: string): string {
    return match;
  }
}
