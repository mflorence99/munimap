import { OLLayerImageComponent } from './ol-layer-image';
import { OLLayerTileComponent } from './ol-layer-tile';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnDestroy } from '@angular/core';

import { inject } from '@angular/core';

import copy from 'fast-copy';
import Crop from 'ol-ext/filter/Crop';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-crop2boundary',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterCrop2BoundaryComponent
  implements AfterContentInit, OnDestroy
{
  olFilter: Crop;
  #layer: any;
  #layer1 = inject(OLLayerTileComponent, { optional: true });
  #layer2 = inject(OLLayerVectorComponent, { optional: true });
  #layer3 = inject(OLLayerImageComponent, { optional: true });
  #map = inject(OLMapComponent);

  constructor() {
    // 👇 choose which layer parent
    this.#layer = this.#layer1 ?? this.#layer2 ?? this.#layer3;
    // 👇 build the filter
    const coords: any = copy(
      this.#map.boundary().features[0].geometry.coordinates
    );
    const boundary = new Feature(new Polygon(coords));
    boundary
      .getGeometry()
      .transform(this.#map.featureProjection, this.#map.projection);
    this.olFilter = new Crop({
      feature: boundary,
      inner: false
    });
  }

  ngAfterContentInit(): void {
    // 👇 ol-ext has monkey-patched addFilter
    this.#layer?.olLayer['addFilter'](this.olFilter);
  }

  ngOnDestroy(): void {
    // 👇 ol-ext has monkey-patched removeFilter
    this.#layer?.olLayer['removeFilter'](this.olFilter);
  }
}
