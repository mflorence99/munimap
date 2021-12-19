import { DestroyService } from '../services/destroy';
import { OLLayerMapboxComponent } from './ol-layer-mapbox';
import { OLLayerTileComponent } from './ol-layer-tile';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLLayerVectorTileComponent } from './ol-layer-vectortile';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Optional } from '@angular/core';

import { takeUntil } from 'rxjs/operators';

import Crop from 'ol-ext/filter/Crop';
import OLGeoJSON from 'ol/format/GeoJSON';
import union from '@turf/union';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-filter-crop2selected',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterCrop2SelectedComponent
  implements AfterContentInit, OnDestroy, OnInit
{
  #format: OLGeoJSON;
  #layer: any;

  olFilter: typeof Crop;

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
    // 👇 build a new filter as the union of all the selected parcels
    if (this.map.selector?.selected?.length > 0) {
      const geojsons = this.map.selector.selected.map((feature) =>
        JSON.parse(this.#format.writeFeature(feature))
      );
      const merged: any = {
        geometry: geojsons.reduce((acc, geojson) => union(acc, geojson))
          .geometry,
        properties: {},
        type: 'Feature'
      };
      this.olFilter = new Crop({
        active: true,
        feature: this.#format.readFeature(merged),
        inner: false
      });
    }
    // 👇 probably a crap way to do it, but this is meant
    //    to ensure that everyting is cropped, until a selection is made
    else {
      this.olFilter = new Crop({
        active: true,
        feature: this.#format.readFeature({
          geometry: {
            coordinates: [],
            type: 'Polygon'
          },
          type: 'Feature'
        }),
        inner: false
      });
    }
    // 👇 ol-ext has monkey-patched addFilter
    this.#layer.olLayer['addFilter'](this.olFilter);
  }

  #handleFeaturesSelected$(): void {
    this.map.selector?.featuresSelected
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.#addFilter());
  }

  ngAfterContentInit(): void {
    this.#addFilter();
  }

  ngOnDestroy(): void {
    // 👇 ol-ext has monkey-patched removeFilter
    this.#layer.olLayer['removeFilter'](this.olFilter);
  }

  ngOnInit(): void {
    this.#handleFeaturesSelected$();
  }
}
