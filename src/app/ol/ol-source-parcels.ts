import { DestroyService } from '../services/destroy';
import { GeoJSONService } from '../services/geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../state/parcels';
import { ParcelProperties } from '../state/parcels';
import { Parcels } from '../state/parcels';
import { ParcelsState } from '../state/parcels';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Subject } from 'rxjs';

import { bbox } from 'ol/loadingstrategy';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { transformExtent } from 'ol/proj';

import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

// 👇 parcels are different because they can be overridden by the user

const attribution =
  'Powered by <a href="https://www.granit.unh.edu/data/downloadfreedata/alphabetical/databyalpha.html" target="_blank">NH GRANIT</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-source-parcels',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceParcelsComponent implements OnInit {
  #success: Function;

  geojson$ = new Subject<Parcels>();

  olVector: OLVector<any>;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  @Input() path: string;

  constructor(
    private destroy$: DestroyService,
    private geoJSON: GeoJSONService,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private route: ActivatedRoute
  ) {}

  #handleStreams$(): void {
    // 👇 we need to merge the incoming geojson with the latest parcels
    combineLatest([this.geojson$, this.parcels$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([geojson, parcels]) => {
        const geojsonByID = this.#reduceParcels(geojson.features as Parcel[]);
        const parcelsByID = this.#reduceParcels(parcels);
        this.#overrideFeaturesWithParcels(geojson, parcelsByID);
        // TODO 🔥 leave as-is for now -- simply remove features that
        //         are in both the geojson and in the parcels override
        //         when we have timestamps sorted on parcels, only
        //         remove a feature if it is outdated
        Object.keys(parcelsByID).forEach((id) => {
          if (geojsonByID[id]) {
            const feature = this.olVector.getFeatureById(id);
            if (feature) this.olVector.removeFeature(feature);
          }
        });
        // 👉 convert features into OL format
        const features = this.olVector.getFormat().readFeatures(geojson, {
          featureProjection: this.map.projection
        }) as OLFeature<any>[];
        // 👉 add each feature not already present
        this.olVector.addFeatures(features);
        this.#success?.(features);
      });
  }

  #initialize(): void {
    this.olVector = new OLVector({
      attributions: [attribution],
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: bbox
    });
    this.layer.olLayer.setSource(this.olVector);
  }

  #loader(
    extent: number[],
    _resolution: number,
    projection: OLProjection,
    success: Function,
    _failure: Function
  ): void {
    const bbox = transformExtent(
      extent,
      projection,
      this.map.featureProjection
    );
    this.geoJSON
      .loadByIndex(this.route, this.path ?? this.map.path, 'parcels', bbox)
      .subscribe((geojson: Parcels) => {
        // TODO 🔥 is this a miserable hack???
        this.#success = success;
        this.geojson$.next(geojson);
      });
  }

  #mergeProperties(
    toFeature: ParcelProperties,
    fromParcel: ParcelProperties
  ): void {
    Object.keys(fromParcel).forEach((key) => {
      if (fromParcel[key] != null) toFeature[key] = fromParcel[key];
    });
  }

  #overrideFeaturesWithParcels(
    geojson: Parcels,
    parcelsByID: Record<string, Parcel[]>
  ): void {
    geojson.features = geojson.features.map((feature) => {
      const parcels = parcelsByID[feature.id];
      if (parcels) {
        // 👇 parcels are in timestamp order, so we apply the latest last
        //    geometry is all-or-nothing
        //    properties are merged
        parcels.forEach((parcel) => {
          if (parcel.geometry) feature.geometry = parcel.geometry;
          if (parcel.properties)
            this.#mergeProperties(feature.properties, parcel.properties);
        });
      }
      return feature;
    });
  }

  #reduceParcels(parcels: Parcel[]): Record<string, Parcel[]> {
    return parcels.reduce((acc, parcel) => {
      if (!acc[parcel.id]) acc[parcel.id] = [];
      acc[parcel.id].push(parcel);
      return acc;
    }, {} as Record<string, Parcel[]>);
  }

  ngOnInit(): void {
    this.#initialize();
    this.#handleStreams$();
  }
}
