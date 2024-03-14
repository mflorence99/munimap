import { DestroyService } from '../../services/destroy';
import { OLInteractionSelectParcelsComponent } from './ol-interaction-selectparcels';
import { OLLayerTileComponent } from '../ol-layer-tile';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';

import * as Sentry from '@sentry/angular-ivy';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';

import { inject } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

import Crop from 'ol-ext/filter/Crop';
import OLGeoJSON from 'ol/format/GeoJSON';
import union from '@turf/union';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-filter-crop2selectedparcels',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterCrop2SelectedParcelsComponent
  implements AfterContentInit, OnDestroy, OnInit
{
  olFilter: Crop;

  #destroy$ = inject(DestroyService);
  #format: OLGeoJSON;
  #layer: any;
  #layer1 = inject(OLLayerTileComponent, { optional: true });
  #layer2 = inject(OLLayerVectorComponent, { optional: true });
  #map = inject(OLMapComponent);

  constructor() {
    this.#format = new OLGeoJSON({
      dataProjection: this.#map.featureProjection,
      featureProjection: this.#map.projection
    });
    // 👇 choose which layer parent
    this.#layer = this.#layer1 ?? this.#layer2;
  }

  ngAfterContentInit(): void {
    this.#addFilter();
  }

  ngOnDestroy(): void {
    // 👇 ol-ext has monkey-patched removeFilter
    this.#layer?.olLayer['removeFilter'](this.olFilter);
  }

  ngOnInit(): void {
    this.#handleFeaturesSelected$();
  }

  #addFilter(): void {
    // 👉 remove prior filter
    if (this.olFilter) this.#layer?.olLayer['removeFilter'](this.olFilter);
    this.olFilter = null;
    // 👉 the selector MAY not be present
    const selector = this.#map.selector as OLInteractionSelectParcelsComponent;
    // 👇 build a new filter as the union of all the selected parcels
    if (selector?.selected?.length > 0) {
      const geojsons = selector.selected.map((feature) =>
        JSON.parse(this.#format.writeFeature(feature))
      );
      const merged: any = {
        geometry: geojsons.reduce((acc, geojson) => union(acc, geojson))
          .geometry,
        properties: {},
        type: 'Feature'
      };
      // 👇 this may fail!
      try {
        this.olFilter = new Crop({
          feature: this.#format.readFeature(merged),
          inner: false
        });
      } catch (e) {
        const message = `🔥 Crop filter failed for ${selector.selectedIDs} ${e}`;
        console.error(message);
        Sentry.captureMessage(message);
      }
    }
    // 👇 ol-ext has monkey-patched addFilter
    if (this.olFilter) this.#layer?.olLayer['addFilter'](this.olFilter);
  }

  #handleFeaturesSelected$(): void {
    this.#map.featuresSelected
      .pipe(takeUntil(this.#destroy$))
      .subscribe(() => this.#addFilter());
  }
}
