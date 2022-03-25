import { DestroyService } from '../../services/destroy';
import { OLLayerMapboxComponent } from '../ol-layer-mapbox';
import { OLLayerTileComponent } from '../ol-layer-tile';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLLayerVectorTileComponent } from '../ol-layer-vectortile';
import { OLMapComponent } from '../ol-map';
import { OLSourceParcelsComponent } from '../ol-source-parcels';
import { ParcelID } from '../../geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Optional } from '@angular/core';

import { unByKey } from 'ol/Observable';

import Crop from 'ol-ext/filter/Crop';
import OLGeoJSON from 'ol/format/GeoJSON';
import union from '@turf/union';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
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

  @Input() parcelIDs: ParcelID[];

  @Input() source: OLSourceParcelsComponent;

  constructor(
    private destroy$: DestroyService,
    @Optional() layer1: OLLayerMapboxComponent,
    @Optional() layer2: OLLayerTileComponent,
    @Optional() layer3: OLLayerVectorComponent,
    @Optional() layer4: OLLayerVectorTileComponent,
    private map: OLMapComponent
  ) {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
    // 👇 choose which layer parent
    this.#layer = layer1 ?? layer2 ?? layer3 ?? layer4;
  }

  #addFilter(): void {
    // 👉 remove prior filter
    if (this.olFilter) this.#layer.olLayer['removeFilter'](this.olFilter);
    const geojsons = this.source.olVector
      .getFeatures()
      .filter((feature) => this.parcelIDs.includes(feature.getId()))
      .map((feature) => JSON.parse(this.#format.writeFeature(feature)));
    const merged: any = {
      geometry: geojsons.reduce((acc, geojson) => union(acc, geojson)).geometry,
      properties: {},
      type: 'Feature'
    };
    this.olFilter = new Crop({
      active: true,
      feature: this.#format.readFeature(merged),
      inner: false
    });
    // 👇 ol-ext has monkey-patched addFilter
    this.#layer.olLayer['addFilter'](this.olFilter);
  }

  ngOnDestroy(): void {
    if (this.#featuresLoadedKey) unByKey(this.#featuresLoadedKey);
    // 👇 ol-ext has monkey-patched removeFilter
    this.#layer.olLayer['removeFilter'](this.olFilter);
  }

  ngOnInit(): void {
    this.#featuresLoadedKey = this.source.olVector.on('featuresloadend', () => {
      this.#addFilter();
    });
  }
}
