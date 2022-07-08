import { DestroyService } from '../services/destroy';
import { GeoJSONService } from '../services/geojson';
import { OLInteractionSelectParcelsComponent } from './parcels/ol-interaction-selectparcels';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OverlayProperty } from '../state/overlay';
import { OverlayState } from '../state/overlay';
import { Parcel } from '../common';
import { ParcelID } from '../common';
import { Parcels } from '../common';
import { ParcelsState } from '../state/parcels';

import { parcelProperties } from '../common';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';

import { all as allStrategy } from 'ol/loadingstrategy';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
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
  #geojson$ = new Subject<Parcels>();
  #success: Function;

  olVector: OLVector<any>;

  overlay$: Observable<OverlayProperty[]>;

  parcels$: Observable<Parcel[]>;

  @Input() path: string;

  constructor(
    private destroy$: DestroyService,
    private geoJSON: GeoJSONService,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private parcelsState: ParcelsState,
    private route: ActivatedRoute,
    private store: Store
  ) {
    let strategy;
    if (this.map.loadingStrategy === 'all') strategy = allStrategy;
    else if (this.map.loadingStrategy === 'bbox') strategy = bboxStrategy;
    this.olVector = new OLVector({
      attributions: [attribution],
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: strategy
    });
    this.olVector.setProperties({ component: this }, true);
    this.layer.olLayer.setSource(this.olVector);
    // 🔥 must do it this way so we can dynamically create component
    //    this is new behavior with Angular 14
    this.overlay$ = this.store.select((state) => state.overlay);
    this.parcels$ = this.store.select((state) => state.parcels);
  }

  #filterRemovedFeatures(geojson: Parcels, parcels: Parcel[]): Set<ParcelID> {
    const removed = this.parcelsState.parcelsRemoved(parcels);
    // 👉 remove them from the layer in case they're already there
    removed.forEach((id) => {
      const feature = this.olVector.getFeatureById(id);
      if (feature) this.olVector.removeFeature(feature);
    });
    // 👉 remove them from the geojson
    geojson.features = geojson.features.filter(
      (feature) => !removed.has(feature.id)
    );
    return removed;
  }

  #handleStreams$(): void {
    // 👇 we need to merge the incoming geojson with the latest parcels
    //    also with the overlay, but we only care here if it has changed
    //    we'll look at its value when we come to style the parcels
    combineLatest([this.#geojson$, this.parcels$, this.overlay$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([original, parcels]) => {
        const originalsByID = original.features.reduce((acc, feature) => {
          acc[feature.id] = feature;
          return acc;
        }, {});
        // 👉 take a copy of the geojson before we change it
        const geojson = copy(original);
        const added = this.#insertAddedFeatures(geojson, parcels);
        this.#filterRemovedFeatures(geojson, parcels);
        this.#overrideFeaturesWithParcels(geojson, parcels);
        // 👉 remove the features that are in the geojson
        //    because they will potentially be modified
        //    by the parcel overrides
        Object.keys(originalsByID)
          .concat(Array.from(added as any))
          .forEach((id) => {
            const feature = this.olVector.getFeatureById(id);
            if (feature) this.olVector.removeFeature(feature);
          });
        // 👉 convert features into OL format
        const features = this.olVector.getFormat().readFeatures(geojson, {
          featureProjection: this.map.projection
        }) as OLFeature<any>[];
        // 👉 add each feature not already present
        features.forEach((feature) => {
          if (!this.olVector.hasFeature(feature))
            this.olVector.addFeature(feature);
        });
        // 👉 the selector MAY not be present and may not be for parcels
        const selector = this.map
          .selector as OLInteractionSelectParcelsComponent;
        // 👉 reselect selected features b/c we've potentially removed them
        const selectedIDs = selector?.selectedIDs;
        if (selectedIDs?.length > 0) selector?.reselectParcels?.(selectedIDs);
        this.#success?.(features);
      });
  }

  #insertAddedFeatures(geojson: Parcels, parcels: Parcel[]): Set<ParcelID> {
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
    return added;
  }

  #loader(
    extent: Coordinate,
    resolution: number,
    projection: OLProjection,
    success: Function
  ): void {
    let bbox;
    // 👉 get everything at once
    if (this.map.loadingStrategy === 'all') bbox = this.map.bbox;
    // 👉 or just get what's visible
    else if (this.map.loadingStrategy === 'bbox')
      bbox = transformExtent(extent, projection, this.map.featureProjection);
    this.geoJSON
      .loadByIndex(this.route, this.path ?? this.map.path, 'parcels', bbox)
      .subscribe((geojson: Parcels) => {
        this.#success = success;
        this.#geojson$.next(geojson);
      });
  }

  #overrideFeaturesWithParcels(geojson: Parcels, parcels: Parcel[]): void {
    const modified = this.parcelsState.parcelsModified(parcels);
    geojson.features = geojson.features.map((feature) => {
      const parcels = modified[feature.id];
      if (parcels) {
        // 👇 deal with property overrides first
        //    consider each property one at a time
        //    scan all the parcel overrides in reverse timestamp order
        //    null says let the feature property stand
        //    not undefined says override the feature property
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

  // 👇 special backdoor to support "export parcels" functionality

  export(
    extent: Coordinate,
    resolution: number,
    projection: OLProjection,
    success: Function
  ): void {
    this.#loader(extent, resolution, projection, success);
  }

  ngOnInit(): void {
    this.#handleStreams$();
  }
}
