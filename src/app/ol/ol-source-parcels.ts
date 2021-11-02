import { DestroyService } from '../services/destroy';
import { Feature } from '../state/parcels';
import { Features } from '../state/parcels';
import { GeoJSONService } from '../services/geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
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
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';

import { bbox } from 'ol/loadingstrategy';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { transformExtent } from 'ol/proj';

import copy from 'fast-copy';
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
  #geojson$ = new Subject<Features>();
  #success: Function;

  olVector: OLVector<any>;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  @Input() path: string;

  constructor(
    private destroy$: DestroyService,
    private geoJSON: GeoJSONService,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private route: ActivatedRoute,
    private store: Store
  ) {}

  #groupByID<T>(things: T[]): Record<string, T[]> {
    return things.reduce((acc, thing) => {
      if (!acc[thing['id']]) acc[thing['id']] = [];
      acc[thing['id']].push(thing);
      return acc;
    }, {} as Record<string, T[]>);
  }

  #handleStreams$(): void {
    // 👇 we need to merge the incoming geojson with the latest parcels
    combineLatest([this.#geojson$, this.parcels$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([geojson, parcels]) => {
        const featuresByID = this.#groupByID<Feature>(geojson.features);
        const parcelsByID = this.#groupByID<Parcel>(parcels);
        this.#overrideFeaturesWithParcels(geojson, parcelsByID);
        // 👉 remove features that are in both the geojson
        //    and in the parcels override -- then they'll get
        //    added back via "addFeatures" below
        let featuresRemoved = false;
        const selectedIDs = this.map.selector.selectedIDs;
        Object.keys(parcelsByID).forEach((id) => {
          if (featuresByID[id]) {
            const feature = this.olVector.getFeatureById(id);
            if (feature) {
              featuresRemoved = true;
              this.olVector.removeFeature(feature);
            }
          }
        });
        // 👉 convert features into OL format
        const features = this.olVector.getFormat().readFeatures(geojson, {
          featureProjection: this.map.projection
        }) as OLFeature<any>[];
        // 👉 add each feature not already present
        this.olVector.addFeatures(features);
        // 👉 if we removed features, only to recreate them,
        //    we'll need to reselect them
        if (featuresRemoved && selectedIDs.length > 0)
          this.map.selector.reselectParcels(selectedIDs);
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
      .subscribe((geojson: Features) => {
        // TODO 🔥 is this a miserable hack???
        this.#success = success;
        this.#geojson$.next(geojson);
      });
  }

  #overrideFeaturesWithParcels(
    geojson: Features,
    parcelsByID: Record<string, Parcel[]>
  ): void {
    geojson.features = geojson.features.map((feature) => {
      const parcels = parcelsByID[feature.id];
      if (parcels) {
        // 👇 deal with property overrides first
        //    consider each property one at a time
        //    scan all the parcel overrides in reverse timestamp order
        //    null says let the feature property stand
        //    not undefined says override the feature property
        //    save the original feature before modification
        Object.keys(feature.properties).forEach((prop) => {
          parcels
            .filter((parcel) => parcel.properties)
            .some((parcel) => {
              if (parcel.properties[prop] === null) {
                const original = this.map.getOriginalFeature(feature.id);
                if (original)
                  feature.properties[prop] = copy(original.properties[prop]);
                return true;
              } else if (parcel.properties[prop] !== undefined) {
                this.map.saveOriginalFeature(feature);
                feature.properties[prop] = copy(parcel.properties[prop]);
                return true;
              }
            });
        });
        // 👇 then a similar process for geometry overrides
        //    geometry overrides are all-or-nothing
        //    scan all the parcel overrides in reverse timestamp order
        //    null says let the feature geometry stand
        //    not undefined says override the feature geometry
        //    save the original feature before modification
        parcels
          .filter((parcel) => parcel.geometry)
          .some((parcel) => {
            if (parcel.geometry === null) {
              return true;
              const original = this.map.getOriginalFeature(feature.id);
              if (original) feature.geometry = copy(original.geometry);
            } else if (
              parcel.geometry !== undefined &&
              Object.keys(parcel.geometry).length > 0
            ) {
              this.map.saveOriginalFeature(feature);
              feature.geometry = copy(parcel.geometry);
              return true;
            }
          });
      }
      return feature;
    });
  }

  ngOnInit(): void {
    this.#initialize();
    this.#handleStreams$();
  }
}
