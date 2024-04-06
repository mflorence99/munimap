import { HistoricalsService } from '../services/historicals';
import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

import OLXYZ from 'ol/source/XYZ';

// 🔥 we don't do anything if the map is NOT tiled
//    potentially delagting to OLSourceHistoricalImageComponent
//    this may not be the best factoring, but it keeps the code
//    separate at this more-or-less experimental ChangeDetectionStrategy

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-historicalxyz',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceHistoricalXYZComponent {
  map = input.required<string>();
  olXYZ: OLXYZ;

  #historicals = inject(HistoricalsService);
  #layer = inject(OLLayerTileComponent);
  #map = inject(OLMapComponent);

  constructor() {
    effect(() => {
      // 👇 find the metadata
      const historicalMap = this.#historicals
        .historicalsFor(this.#map.path())
        .find((historical) => historical.name === this.map());
      // 👇 only if metadata found and map is tiled
      if (historicalMap && historicalMap.tiled) {
        // 👇 create the image source
        this.olXYZ = new OLXYZ({
          attributions: [historicalMap.attribution],
          crossOrigin: 'anonymous',
          maxZoom: historicalMap.maxZoom,
          minZoom: historicalMap.minZoom,
          url: historicalMap.url
        });
        this.olXYZ.setProperties({ component: this }, true);
        this.#layer.olLayer.setSource(this.olXYZ);
      }
    });
  }
}
