import { OLLayerTileComponent } from '../ol-layer-tile';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';
import { OLSourceParcelsComponent } from '../ol-source-parcels';
import { ParcelID } from '../../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Optional } from '@angular/core';

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
  #featuresLoadedKey: OLEventsKey;
  #format: OLGeoJSON;
  #layer: any;

  olFilter: typeof Crop;

  @Input() opacity = 0.33;

  @Input() parcelIDs: ParcelID[];

  @Input() source: OLSourceParcelsComponent;

  @Input() type: 'crop' | 'mask';

  constructor(
    @Optional() layer1: OLLayerTileComponent,
    @Optional() layer2: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
    // 👇 choose which layer parent
    this.#layer = layer1 ?? layer2;
  }

  #addFilter(): void {
    // 👉 remove prior filter
    if (this.olFilter) this.#layer.olLayer['removeFilter'](this.olFilter);
    const features = this.source.olVector.getFeatures();
    if (features.length > 0) {
      // 👉 union all features to make crop/mask
      const geojsons = features
        .filter((feature) => this.parcelIDs.includes(feature.getId()))
        .map((feature) => JSON.parse(this.#format.writeFeature(feature)));
      const merged: any = {
        geometry: geojsons.reduce((acc, geojson) => union(acc, geojson))
          .geometry,
        properties: {},
        type: 'Feature'
      };
      // 👇 crop or mask?
      if (this.type === 'crop') {
        this.olFilter = new Crop({
          active: true,
          feature: this.#format.readFeature(merged),
          inner: false
        });
      }
      // 👇 crop or mask?
      else if (this.type === 'mask') {
        this.olFilter = new Mask({
          active: true,
          feature: this.#format.readFeature(merged),
          fill: new OLFill({ color: [128, 128, 128, this.opacity] }),
          inner: false
        });
      }
      // 👇 ol-ext has monkey-patched addFilter
      this.#layer?.olLayer['addFilter'](this.olFilter);
    }
  }

  ngOnDestroy(): void {
    if (this.#featuresLoadedKey) unByKey(this.#featuresLoadedKey);
    // 👇 ol-ext has monkey-patched removeFilter
    if (this.olFilter) this.#layer?.olLayer['removeFilter'](this.olFilter);
  }

  ngOnInit(): void {
    this.#addFilter();
    this.#featuresLoadedKey = this.source.olVector.on('featuresloadend', () => {
      this.#addFilter();
    });
  }
}
