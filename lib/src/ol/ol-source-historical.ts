import { HistoricalsService } from '../services/historicals';
import { OLLayerImageComponent } from './ol-layer-image';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

import copy from 'fast-copy';
import Feature from 'ol/Feature';
import OLImage from 'ol-ext/source/GeoImage';
import Polygon from 'ol/geom/Polygon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-historical',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceHistoricalComponent {
  map = input.required<string>();
  maxZoom = input(13);
  minZoom = input(9);
  olImage: OLImage;

  #historicals = inject(HistoricalsService);
  #layer = inject(OLLayerImageComponent);
  #map = inject(OLMapComponent);

  constructor() {
    effect(() => {
      // 👇 build the mask
      const coords: any = copy(
        this.#map.boundary().features[0].geometry.coordinates
      );
      const boundary = new Feature(new Polygon(coords));
      boundary
        .getGeometry()
        .transform(this.#map.featureProjection, this.#map.projection);
      // 👇 find the metadata
      const historicalMap = this.#historicals
        .historicalsFor(this.#map.path())
        .find((historical) => historical.description === this.map());
      // 👇 create the image source
      if (historicalMap) {
        this.olImage = new OLImage({
          imageCenter: historicalMap.imageCenter,
          imageMask: boundary.getGeometry().getCoordinates()[0],
          imageRotate: historicalMap.imageRotate,
          imageScale: historicalMap.imageScale,
          maxZoom: this.maxZoom(),
          minZoom: this.minZoom(),
          projection: 'EPSG:3857',
          url: historicalMap.url
        });
        this.olImage.setProperties({ component: this }, true);
        this.#layer.olLayer.setSource(this.olImage);
      }
    });
  }
}
