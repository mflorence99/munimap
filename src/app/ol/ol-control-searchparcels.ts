import { DestroyService } from '../services/destroy';
import { Feature } from '../state/parcels';
import { Features } from '../state/parcels';
import { GeoJSONService } from '../services/geojson';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../state/parcels';
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

import fuzzysort from 'fuzzysort';

type Override = { address: string; owner: string };

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
      .subscribe(([geojson, parcels]) => {
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

  // 👇 remember: parcels are in descending order by timestamp
  //    the first "defined" value wins
  //    null means no override, accept the original geojson
  #makeOverridesByID(parcels: Parcel[]): Record<string, Override> {
    return parcels.reduce((acc, parcel) => {
      if (!acc[parcel.id]) acc[parcel.id] = {};
      const props = parcel.properties;
      const override = acc[parcel.id];
      if (props.address !== undefined && override.address === undefined)
        override.address = props.address;
      if (props.owner !== undefined && override.owner === undefined)
        override.owner = props.owner;
      return acc;
    }, {});
  }

  #makeSearchTargets(searchables: Feature[]): any[] {
    const keys = new Set<string>();
    searchables.forEach((searchable) => {
      const props = searchable.properties;
      const override = this.#overridesByID[searchable.id];
      if (override?.address) keys.add(override.address);
      else if (props.address) keys.add(props.address);
      if (override?.owner) keys.add(override.owner);
      else if (props.owner) keys.add(props.owner);
      keys.add(props.id);
    });
    return Array.from(keys).map((key) => fuzzysort.prepare(key));
  }

  input(str: string): string {
    const searchFor = str.toUpperCase();
    // 👉 let's see if we have a direct hit by ID, then address, then owner
    const seathables =
      this.#searchablesByID[searchFor] ??
      this.#searchablesByAddress[searchFor] ??
      this.#searchablesByOwner[searchFor];
    if (seathables) {
      // 👉 we have a hit, tell the selector
      this.matches = [];
      const ids = seathables.map((searchable) => searchable.id).join(', ');
      console.log(`%cFound parcels`, 'color: indianred', `[${ids}]`);
      this.map.selector.selectParcels(seathables);
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
}
