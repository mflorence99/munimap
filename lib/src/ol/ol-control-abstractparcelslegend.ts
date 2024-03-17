import { CountableParcels } from '../common';
import { DestroyService } from '../services/destroy';
import { GeoJSONService } from '../services/geojson';
import { Mapable } from './ol-mapable';
import { MapState } from '../state/map';
import { Parcel } from '../common';
import { ParcelID } from '../common';
import { ParcelProperties } from '../common';
import { ParcelsState } from '../state/parcels';

import { isParcelStollen } from '../common';
import { parcelPropertiesOwnership } from '../common';
import { parcelPropertiesUsage } from '../common';
import { parcelPropertiesUse } from '../common';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Control as OLControl } from 'ol/control';
import { Observable } from 'rxjs';
import { Signal } from '@angular/core';
import { Subject } from 'rxjs';

import { combineLatest } from 'rxjs';
import { inject } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';

type Accumulator = Record<string, number>;

type Conformity = [tag: string, area: number];

interface Countable {
  area?: number;
  ownership?: string;
  usage?: string;
  use?: string;
}

export class Legend extends OLControl {
  constructor(opts: any) {
    super(opts);
  }
}

export abstract class OLControlAbstractParcelsLegendComponent
  implements Mapable
{
  areaByConformity: Accumulator;
  areaByOwnership: Accumulator;
  areaByUsage: Accumulator;
  areaOfParcels: number;
  // 🔥 this only works for Washington
  conformities: Conformity[] = [
    ['\u00bc acre', 0.25],
    ['\u00bd acre', 0.5],
    ['\u00be acre', 0.75],
    ['1 acre', 1],
    ['2 acres', 2],
    ['3 acres', 3],
    ['4 acres', 4]
  ];
  countByConformity: Accumulator;
  countByOwnership: Accumulator;
  countByUsage: Accumulator;
  olControl: OLControl;
  parcelPropertiesOwnership = parcelPropertiesOwnership;
  parcelPropertiesUsage = parcelPropertiesUsage;
  parcelPropertiesUse = parcelPropertiesUse;

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #geoJSON = inject(GeoJSONService);
  #geojson$ = new Subject<CountableParcels>();
  #mapState = inject(MapState);
  #parcelsState = inject(ParcelsState);
  #route = inject(ActivatedRoute);

  abstract county: Signal<string>;
  abstract id: Signal<string>;
  abstract parcels$: Observable<Parcel[]>;
  abstract printing: Signal<boolean>;
  abstract state: Signal<string>;
  abstract title: Signal<string>;

  addToMap(): void {}

  // 👉 may be implemented by subclass
  aggregateParcelImpl(_props: ParcelProperties): void {}

  // 🔥 may be overridden by subclasses
  //    we onky had to "invent" this for APDVD
  countables(): string {
    return 'countables';
  }

  onInit(): void {
    this.#resetCounters();
    this.#handleGeoJSON$();
    this.#handleStreams$();
  }

  quantizeConformingArea(area: number): number {
    const conforming = this.conformities.at(-1)[1];
    return Math.trunc((conforming - area) * (10 / conforming));
  }

  // 👉 may be implemented by subclass
  resetCountersImpl(): void {}

  #aggregateFeature(acc: Accumulator, by: string, value: number): void {
    if (!acc[by]) acc[by] = 0;
    acc[by] += value;
  }

  #aggregateParcel(props: ParcelProperties): void {
    // 👇 simple aggregation by property
    this.#aggregateFeature(this.areaByOwnership, props.ownership, props.area);
    this.#aggregateFeature(this.countByOwnership, props.ownership, 1);
    this.#aggregateFeature(this.areaByUsage, props.usage, props.area);
    this.#aggregateFeature(this.countByUsage, props.usage, 1);
    // 👇 quantization by area
    this.#filterConformities(props.area).forEach((conformity) => {
      this.#aggregateFeature(this.areaByConformity, conformity[0], props.area);
      this.#aggregateFeature(this.countByConformity, conformity[0], 1);
    });
    // 👇 any additional aggregation
    this.aggregateParcelImpl(props);
  }

  #aggregateParcels(geojson: CountableParcels, parcels: Parcel[]): void {
    this.#resetCounters();
    // 👉 build aggregate data structures
    this.#insertAddedFeatures(geojson, parcels);
    this.#filterRemovedFeatures(geojson, parcels);
    const overridesByID = this.#makeOverridesByID(parcels);
    // 👇 for each feature ...
    geojson.features.forEach((feature) => {
      const override = overridesByID[feature.id];
      const props = Object.assign(feature.properties, override);
      this.#aggregateParcel(props);
    });
    // 👉 count the total area of all parcels
    this.areaOfParcels = Object.values(this.areaByUsage).reduce(
      (p, q) => p + q,
      0
    );
  }

  #filterConformities(area: number): Conformity[] {
    return this.conformities.filter((conformity) => area < conformity[1]);
  }

  // 👇 stolen parcels don't count!
  #filterRemovedFeatures(geojson: CountableParcels, parcels: Parcel[]): void {
    const removed = this.#parcelsState.parcelsRemoved(parcels);
    geojson.features = geojson.features.filter(
      (feature) => !removed.has(feature.id) && !isParcelStollen(feature.id)
    );
  }

  // 👉 the idea behind "countables" is to provide just enough data for
  //    parcels to be aggregated -- we do this because we MUST have ALL
  //    the data available -- so countables are degenerate parcels with
  //    just area, usage and use

  #handleGeoJSON$(): void {
    this.#geoJSON
      .loadByIndex(
        this.#route,
        this.#mapState.currentMap().path,
        this.countables()
      )
      .subscribe((geojson: CountableParcels) => this.#geojson$.next(geojson));
  }

  #handleStreams$(): void {
    // 👇 we need to merge the incoming geojson with the latest parcels
    combineLatest([this.#geojson$, this.parcels$])
      .pipe(takeUntil(this.#destroy$))
      .subscribe(([original, parcels]) => {
        // 👉 take a copy of the geojson before we change it
        const geojson = copy(original);
        this.#aggregateParcels(geojson, parcels);
        this.#cdf.markForCheck();
      });
  }

  #insertAddedFeatures(geojson: CountableParcels, parcels: Parcel[]): void {
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

  #makeOverridesByID(parcels: Parcel[]): Record<ParcelID, Countable> {
    const modified = this.#parcelsState.parcelsModified(parcels);
    // 👉 merge all the modifications into a single override
    return Object.keys(modified).reduce((acc, id) => {
      const override: Countable = {};
      modified[id].forEach((parcel) => {
        const props = parcel.properties;
        if (props) {
          ['area', 'ownership', 'usage', 'use'].forEach((prop) => {
            if (props[prop] !== undefined && override[prop] === undefined)
              override[prop] = props[prop];
          });
        }
      });
      acc[id] = override;
      return acc;
    }, {});
  }

  #resetCounters(): void {
    this.areaByConformity = {};
    this.areaByOwnership = {};
    this.areaByUsage = {};
    this.countByConformity = {};
    this.countByOwnership = {};
    this.countByUsage = {};
    // 👇 addtional counters
    this.resetCountersImpl();
  }
}
