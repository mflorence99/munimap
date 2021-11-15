import { DestroyService } from '../services/destroy';
import { OLLayerMapboxComponent } from './ol-layer-mapbox';
import { OLLayerTileComponent } from './ol-layer-tile';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLLayerVectorTileComponent } from './ol-layer-vectortile';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
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
export class OLFilterCrop2SelectedComponent implements AfterContentInit {
  #empty: Crop;
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
    // TODO 🔥 probably a crap way to do it, but this is meant
    //         to ensure that everyting is cropped, until a
    //         selection is made
    this.#empty = new Crop({
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
    // 👇 choose which layer parent
    this.#layer = layer1 ?? layer2 ?? layer3 ?? layer4;
  }

  #handleFeaturesSelected$(): void {
    this.map.selector.featuresSelected
      .pipe(takeUntil(this.destroy$))
      .subscribe((selected) => {
        let filter = this.#empty;
        if (selected?.length > 0) {
          // 👇 build the filter as the union of all the selected parcels
          const geojsons = selected.map((feature) =>
            JSON.parse(this.#format.writeFeature(feature))
          );
          const merged: any = {
            geometry: geojsons.reduce((acc, geojson) => union(acc, geojson))
              .geometry,
            properties: {},
            type: 'Feature'
          };
          filter = new Crop({
            active: true,
            feature: this.#format.readFeature(merged),
            inner: false
          });
        }
        // 👇 ol-ext has monkey-patched addFilter, getFilters etc
        const filters = [...this.#layer.olLayer['getFilters']()];
        filters.forEach((filter) =>
          this.#layer.olLayer['removeFilter'](filter)
        );
        this.#layer.olLayer['addFilter'](filter);
      });
  }

  ngAfterContentInit(): void {
    this.#layer.olLayer['addFilter'](this.#empty);
    this.#handleFeaturesSelected$();
  }
}
