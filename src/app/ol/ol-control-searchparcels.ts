import { Feature } from '../state/parcels';
import { Features } from '../state/parcels';
import { GeoJSONService } from '../services/geojson';
import { OLMapComponent } from './ol-map';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

import fuzzysort from 'fuzzysort';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-searchparcels',
  templateUrl: './ol-control-searchparcels.html',
  styleUrls: ['./ol-control-searchparcels.scss']
})
export class OLControlSearchParcelsComponent implements OnInit {
  #parcelsByAddress: Record<string, Feature[]> = {};
  #parcelsByID: Record<string, Feature[]> = {};
  #parcelsByOwner: Record<string, Feature[]> = {};
  #searchTargets = [];

  @Input() fuzzyMaxResults = 100;
  @Input() fuzzyMinLength = 3;
  @Input() fuzzyThreshold = -10000;

  matches: string[] = [];

  @Input() matchesMaxVisible = 20;

  constructor(
    private geoJSON: GeoJSONService,
    private map: OLMapComponent,
    private route: ActivatedRoute
  ) {}

  // 👉 the idea behind searchables is to provide just enough data for
  //    parcels to be searched -- we do this because we MUST have ALL
  //    the data available

  #handleGeoJSON$(): void {
    this.geoJSON
      .loadByIndex(this.route, this.map.path, 'searchables')
      .subscribe((geojson: Features) => {
        const parcels = geojson.features;
        this.#searchTargets = this.#makeSearchTargets(parcels);
        this.#parcelsByAddress = this.#reduceParcelsByProperty(
          parcels,
          'address'
        );
        this.#parcelsByID = this.#reduceParcelsByProperty(parcels, 'id');
        this.#parcelsByOwner = this.#reduceParcelsByProperty(parcels, 'owner');
      });
  }

  #makeSearchTargets(parcels: Feature[]): any[] {
    const keys = new Set<string>();
    parcels.forEach((parcel) => {
      const props = parcel.properties;
      keys.add(props.id);
      if (props.address) keys.add(props.address);
      if (props.owner) keys.add(props.owner);
    });
    return Array.from(keys).map((key) => fuzzysort.prepare(key));
  }

  #reduceParcelsByProperty(
    parcels: Feature[],
    prop: string
  ): Record<string, Feature[]> {
    return parcels.reduce((acc, parcel) => {
      const props = parcel.properties;
      if (props[prop]) {
        if (!acc[props[prop]]) acc[props[prop]] = [parcel];
        else acc[props[prop]].push(parcel);
      }
      return acc;
    }, {});
  }

  input(str: string): string {
    const searchFor = str.toUpperCase();
    // 👉 let's see if we have a direct hit by ID, then address, then owner
    const parcels =
      this.#parcelsByID[searchFor] ??
      this.#parcelsByAddress[searchFor] ??
      this.#parcelsByOwner[searchFor];
    if (parcels) {
      // 👉 we have a hit, tell the selector
      this.matches = [];
      const ids = parcels.map((parcel) => parcel.id).join(', ');
      console.log(`%cFound parcels`, 'color: indianred', `[${ids}]`);
      this.map.selector.selectParcels(parcels);
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
  }
}
