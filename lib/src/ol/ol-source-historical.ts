import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { inject } from '@angular/core';
import { input } from '@angular/core';
import { transformExtent } from 'ol/proj';

import OLXYZ from 'ol/source/XYZ';

// 🔥 TEMPORARY

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-historical',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceHistoricalComponent {
  maxZoom = input(13);
  minZoom = input(9);
  olXYZ: OLXYZ;

  #layer = inject(OLLayerTileComponent);
  #map = inject(OLMapComponent);

  constructor() {
    this.olXYZ = new OLXYZ({
      attributions:
        '<a href="https://www.maptiler.com/engine/">MapTiler Engine</a>',
      maxZoom: this.maxZoom(),
      minZoom: this.minZoom(),
      url: 'assets/historical/1942/{z}/{x}/{y}.jpg'
    });
    this.olXYZ.setProperties({ component: this }, true);
    this.#layer.olLayer.setExtent(
      transformExtent(
        [-72.28893477, 42.96954074, -71.95694729, 43.26855602],
        this.#map.featureProjection,
        this.#map.projection
      )
    );
    this.#layer.olLayer.setSource(this.olXYZ);
  }
}
