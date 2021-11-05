import { DestroyService } from '../services/destroy';
import { Feature } from '../state/parcels';
import { Features } from '../state/parcels';
import { GeoJSONService } from '../services/geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../state/parcels';
import { ParcelsState } from '../state/parcels';

import { parcelProperties } from '../state/parcels';

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
    // 👉 remove them from the layer in case they're already there
    removedIDs.forEach((removedID) => {
      const feature = this.olVector.getFeatureById(removedID);
      if (feature) this.olVector.removeFeature(feature);
    });
    // 👉 remove them from the geojson so they can't get put back
    geojson.features = geojson.features.filter(
      (feature) => !removedIDs.has(feature.id)
    );
  }

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
      .subscribe(([original, parcels]) => {
        // 👉 remove the features that are in the geojson
        //    because they will potentially be modified
        //    by the parcel overrides -- we use groupByID for
        //    convenience, but there's only one feature per ID
        const originalsByID = this.#groupByID<Feature>(original.features);
        Object.keys(originalsByID).forEach((id) => {
          const feature = this.olVector.getFeatureById(id);
          if (feature) this.olVector.removeFeature(feature);
        });
        // 👉 take a copy of the geojson before we change it
        const geojson = copy(original);
        const parcelsByID = this.#groupByID<Parcel>(parcels);
        this.#filterRemovedFeatures(geojson, parcels);
        this.#overrideFeaturesWithParcels(geojson, parcelsByID);
        // 👉 convert features into OL format
        const features = this.olVector.getFormat().readFeatures(geojson, {
          featureProjection: this.map.projection
        }) as OLFeature<any>[];
        // 👉 attach the original properties to each OL feature
        features.forEach((feature) => {
          const originalProperties =
            originalsByID[feature.getId()]?.[0]?.properties;
          feature.set('originalProperties', originalProperties, true);
        });
        // 👉 refresh each feature
        this.olVector.addFeatures(features);
        // 👉 reselect selected features b/c we've potentially removed them
        const selectedIDs = this.map.selector.selectedIDs;
        if (selectedIDs.length > 0)
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
        parcelProperties.forEach((prop) => {
          parcels
            .filter((parcel) => parcel.properties)
            .some((parcel) => {
              if (parcel.properties[prop] === null) {
                return true;
              } else if (parcel.properties[prop] !== undefined) {
                feature.properties[prop] = copy(parcel.properties[prop]);
                return true;
              }
            });
        });
        // 👇 then a similar process for geometry overrides
        //    geometry overrides are all-or-nothing
        //    if geometry changes, so does bbox
        //    scan all the parcel overrides in reverse timestamp order
        //    null says let the feature geometry stand
        //    not undefined says override the feature geometry
        //    save the original feature before modification
        parcels
          .filter((parcel) => parcel.geometry !== undefined)
          .some((parcel) => {
            if (parcel.geometry === null) {
              return true;
            } else if (
              parcel.geometry !== undefined &&
              Object.keys(parcel.geometry).length > 0
            ) {
              feature.bbox = parcel.bbox;
              feature.geometry = parcel.geometry;
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
