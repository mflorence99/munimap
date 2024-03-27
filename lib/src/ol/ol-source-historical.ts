import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

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
      url: `${environment.endpoints.proxy}/historical/1930/{z}/{x}/{y}.jpg`
    });
    this.olXYZ.setProperties({ component: this }, true);
    this.#layer.olLayer.setExtent(
      transformExtent(
        [-72.19862661, 43.12490044, -71.99994973, 43.25065641],
        this.#map.featureProjection,
        this.#map.projection
      )
    );
    this.#layer.olLayer.setSource(this.olXYZ);
  }
}
