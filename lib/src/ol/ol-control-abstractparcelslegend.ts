import { DestroyService } from '../services/destroy';
import { GeoJSONService } from '../services/geojson';
import { Mapable } from './ol-mapable';
import { MapState } from '../state/map';
import { Parcel } from '../common';
import { ParcelID } from '../common';
import { Parcels } from '../common';
import { ParcelsState } from '../state/parcels';

import { parcelPropertiesUsage } from '../common';
import { parcelPropertiesUse } from '../common';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Control as OLControl } from 'ol/control';
import { KeyValue } from '@angular/common';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';

import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';

export class Legend extends OLControl {
  constructor(opts: any) {
    super(opts);
  }
}

interface Override {
  area?: number;
  usage?: string;
  use?: string;
}

export abstract class OLControlAbstractParcelsLegendComponent
  implements Mapable
{
  areaByUsage: Record<string, number> = {};
  areaByUse: Record<string, number> = {};
  areaOfParcels: number;
  countByUsage: Record<string, number> = {};
  olControl: OLControl;
  parcelPropertiesUsage = parcelPropertiesUsage;
  parcelPropertiesUse = parcelPropertiesUse;

  #geojson$ = new Subject<Parcels>();

  abstract county: string;
  abstract id: string;
  abstract parcels$: Observable<Parcel[]>;
  abstract printing: boolean;
  abstract state: string;
  abstract title: string;

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private geoJSON: GeoJSONService,
    private mapState: MapState,
    private parcelsState: ParcelsState,
    private route: ActivatedRoute
  ) {}

  addToMap(): void {}

  onInit(): void {
    this.#handleGeoJSON$();
    this.#handleStreams$();
  }

  trackByKeyValue(ix: number, item: KeyValue<string, string>): string {
    return item.key;
  }

  #filterRemovedFeatures(geojson: Parcels, parcels: Parcel[]): void {
    const removed = this.parcelsState.parcelsRemoved(parcels);
    geojson.features = geojson.features.filter(
      (feature) => !removed.has(feature.id)
    );
  }

  // 👉 the idea behind "countables" is to provide just enough data for
  //    parcels to be aggregated -- we do this because we MUST have ALL
  //    the data available -- so countables are degenerate parcels with
  //    just area, usage and use

  #handleGeoJSON$(): void {
    this.geoJSON
      .loadByIndex(this.route, this.mapState.currentMap().path, 'countables')
      .subscribe((geojson: Parcels) => this.#geojson$.next(geojson));
  }

  #handleStreams$(): void {
    // 👇 we need to merge the incoming geojson with the latest parcels
    combineLatest([this.#geojson$, this.parcels$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([original, parcels]) => {
        // 👉 take a copy of the geojson before we change it
        const geojson = copy(original);
        // 👉 build aggregate data structures
        this.#insertAddedFeatures(geojson, parcels);
        this.#filterRemovedFeatures(geojson, parcels);
        const overridesByID = this.#makeOverridesByID(parcels);
        // 👉 aggregate area by usage
        this.areaByUsage = geojson.features.reduce((acc, feature) => {
          const override = overridesByID[feature.id];
          const area = override?.area ?? feature.properties.area;
          const usage = override?.usage ?? feature.properties.usage;
          if (!acc[usage]) acc[usage] = 0;
          acc[usage] += area;
          return acc;
        }, {});
        // 👉 aggregate area by use
        this.areaByUse = geojson.features.reduce((acc, feature) => {
          const override = overridesByID[feature.id];
          const area = override?.area ?? feature.properties.area;
          const use = override?.use ?? feature.properties.use;
          if (!acc[use]) acc[use] = 0;
          acc[use] += area;
          return acc;
        }, {});
        // 👉 aggregate count by usage
        this.countByUsage = geojson.features.reduce((acc, feature) => {
          const override = overridesByID[feature.id];
          const usage = override?.usage ?? feature.properties.usage;
          if (!acc[usage]) acc[usage] = 0;
          acc[usage] += 1;
          return acc;
        }, {});
        this.areaOfParcels = Object.values(this.areaByUsage).reduce(
          (p, q) => p + q,
          0
        );
        this.cdf.markForCheck();
      });
  }

  #insertAddedFeatures(geojson: Parcels, parcels: Parcel[]): void {
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
        const props = parcel.properties;
        if (props) {
          ['area', 'usage', 'use'].forEach((prop) => {
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
