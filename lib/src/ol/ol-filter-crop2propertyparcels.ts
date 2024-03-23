import { OLLayerTileComponent } from './ol-layer-tile';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceParcelsComponent } from './ol-source-parcels';
import { ParcelID } from '../common';

import * as Sentry from '@sentry/angular-ivy';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';

import { inject } from '@angular/core';
import { input } from '@angular/core';
import { unByKey } from 'ol/Observable';

import Crop from 'ol-ext/filter/Crop';
import Mask from 'ol-ext/filter/Mask';
import OLFill from 'ol/style/Fill';
import OLGeoJSON from 'ol/format/GeoJSON';
import union from '@turf/union';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-crop2propertyparcels',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterCrop2PropertyParcelsComponent
  implements OnDestroy, OnInit
{
  olFilter: any;
  opacity = input(0.33);
  parcelIDs = input<ParcelID[]>();
  source = input<OLSourceParcelsComponent>();
  type = input<'crop' | 'mask'>();

  #featuresLoadedKey: OLEventsKey;
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

  ngOnDestroy(): void {
    if (this.#featuresLoadedKey) unByKey(this.#featuresLoadedKey);
    // 👇 ol-ext has monkey-patched removeFilter
    if (this.olFilter) this.#layer?.olLayer['removeFilter'](this.olFilter);
  }

  ngOnInit(): void {
    this.#addFilter();
    this.#featuresLoadedKey = this.source().olVector.on(
      'featuresloadend',
      () => {
        this.#addFilter();
      }
    );
  }

  #addFilter(): void {
    // 👉 remove prior filter
    if (this.olFilter) this.#layer?.olLayer['removeFilter'](this.olFilter);
    this.olFilter = null;
    const features = this.source().olVector.getFeatures();
    if (features.length > 0) {
      // 👉 union all features to make crop/mask
      const geojsons = features
        .filter((feature) => this.parcelIDs().includes(feature.getId()))
        .map((feature) => JSON.parse(this.#format.writeFeature(feature)));
      const merged: any = {
        geometry: geojsons.reduce((acc, geojson) => union(acc, geojson))
          .geometry,
        properties: {},
        type: 'Feature'
      };
      // 👇 this may fail!
      try {
        if (this.type() === 'crop') {
          this.olFilter = new Crop({
            feature: this.#format.readFeature(merged),
            inner: false
          });
        }
        // 👇 crop or mask?
        else if (this.type() === 'mask') {
          this.olFilter = new Mask({
            feature: this.#format.readFeature(merged),
            fill: new OLFill({ color: [128, 128, 128, this.opacity()] }),
            inner: false
          });
        }
      } catch (e) {
        const message = `🔥 Crop/Mask filter failed ${e}`;
        console.error(message);
        Sentry.captureMessage(message);
      }
      // 👇 ol-ext has monkey-patched addFilter
      if (this.olFilter) this.#layer?.olLayer['addFilter'](this.olFilter);
    }
  }
}
