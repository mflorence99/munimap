import { HistoricalMap } from '../common';
import { OLLayerTileComponent } from './ol-layer-tile';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

import OLXYZ from 'ol/source/XYZ';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-historicalxyz',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceHistoricalXYZComponent {
  historicalMap = input.required<HistoricalMap>();
  olXYZ: OLXYZ;

  #layer = inject(OLLayerTileComponent);

  constructor() {
    effect(() => {
      const historicalMap = this.historicalMap();
      if (historicalMap.type === 'tile') {
        // 👇 create the image source
        this.olXYZ = new OLXYZ({
          attributions: [historicalMap.attribution],
          crossOrigin: 'anonymous',
          maxZoom: historicalMap.maxZoom,
          minZoom: historicalMap.minZoom,
          url: historicalMap.url
        });
        this.olXYZ.setProperties({ component: this }, true);
      }
      this.#layer.olLayer.setSource(this.olXYZ);
    });
  }
}
