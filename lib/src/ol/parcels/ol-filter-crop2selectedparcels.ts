import { DestroyService } from '../../services/destroy';
import { OLInteractionSelectParcelsComponent } from './ol-interaction-selectparcels';
import { OLLayerTileComponent } from '../ol-layer-tile';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';

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
  selector: 'app-ol-filter-crop2selectedparcels',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterCrop2SelectedParcelsComponent
  implements AfterContentInit, OnDestroy, OnInit
{
  #format: OLGeoJSON;
  #layer: any;

  olFilter: typeof Crop;

  constructor(
    private destroy$: DestroyService,
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
    // 👉 the selector MAY not be present
    const selector = this.map.selector as OLInteractionSelectParcelsComponent;
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
    this.#layer?.olLayer['addFilter'](this.olFilter);
  }

  #handleFeaturesSelected$(): void {
    this.map.featuresSelected
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.#addFilter());
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
}
