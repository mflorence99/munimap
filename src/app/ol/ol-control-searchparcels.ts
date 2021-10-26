import { GeoJSONService } from '../services/geojson';
import { OLMapComponent } from './ol-map';
import { ParcelProperties } from '../services/geojson';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';

import fuzzysort from 'fuzzysort';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-searchparcels',
  templateUrl: './ol-control-searchparcels.html',
  styleUrls: ['./ol-control-searchparcels.scss']
})
export class OLControlSearchParcelsComponent implements OnInit {
  #parcelsByAddress: Record<string, ParcelProperties[]> = {};
  #parcelsByID: Record<string, ParcelProperties[]> = {};
  #parcelsByOwner: Record<string, ParcelProperties[]> = {};
  #searchTargets = [];

  @Input() fuzzyMaxResults = 100;
  @Input() fuzzyMinLength = 3;
  @Input() fuzzyThreshold = -10000;

  matches: string[] = [];

  @Input() matchesMaxVisible = 20;

  @Output() parcelsFound = new EventEmitter<ParcelProperties[]>();

  constructor(
    private geoJSON: GeoJSONService,
    private map: OLMapComponent,
    private route: ActivatedRoute
  ) {}

  #makeSearchTargets(parcels: ParcelProperties[]): any[] {
    const keys = new Set<string>();
    parcels.forEach((parcel) => {
      keys.add(parcel.id);
      if (parcel.address) keys.add(parcel.address);
      if (parcel.owner) keys.add(parcel.owner);
    });
    return Array.from(keys).map((key) => fuzzysort.prepare(key));
  }

  #reduceParcelsByProperty(
    parcels: ParcelProperties[],
    prop: string
  ): Record<string, ParcelProperties[]> {
    return parcels.reduce((acc, parcel) => {
      if (parcel[prop]) {
        if (!acc[parcel[prop]]) acc[parcel[prop]] = [parcel];
        else acc[parcel[prop]].push(parcel);
      }
      return acc;
    }, {});
  }

  input(str: string): string {
    const searchFor = str.toUpperCase();
    const parcels =
      this.#parcelsByID[searchFor] ??
      this.#parcelsByAddress[searchFor] ??
      this.#parcelsByOwner[searchFor];
    if (parcels) {
      this.matches = [];
      this.parcelsFound.emit(parcels);
    } else if (searchFor.length > this.fuzzyMinLength) {
      this.matches = fuzzysort
        .go(searchFor, this.#searchTargets, {
          limit: this.fuzzyMaxResults,
          threshold: this.fuzzyThreshold
        })
        .map((fuzzy) => fuzzy.target)
        .sort();
    } else if (searchFor.length === 0) {
      this.matches = [];
    }
    return searchFor;
  }

  maxMatcherSize(): number {
    return Math.min(this.matches.length, this.matchesMaxVisible);
  }

  ngOnInit(): void {
    this.geoJSON
      .loadByIndex(this.route, this.map.path, 'parcels')
      .subscribe((geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
        const parcels: ParcelProperties[] = geojson.features.map(
          (parcel: GeoJSON.Feature) => parcel.properties as ParcelProperties
        );
        this.#searchTargets = this.#makeSearchTargets(parcels);
        this.#parcelsByAddress = this.#reduceParcelsByProperty(
          parcels,
          'address'
        );
        this.#parcelsByID = this.#reduceParcelsByProperty(parcels, 'id');
        this.#parcelsByOwner = this.#reduceParcelsByProperty(parcels, 'owner');
      });
  }
}
