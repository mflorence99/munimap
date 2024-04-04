import { HistoricalsService } from '../services/historicals';
import { OLLayerImageComponent } from './ol-layer-image';
import { OLMapComponent } from './ol-map';

import OLImage from './ol-source-geoimage';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import buffer from '@turf/buffer';

import copy from 'fast-copy';
import Feature from 'ol/Feature';
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
  // @ts-ignore 🔥 WTF???
  olImage: OLImage;

  #historicals = inject(HistoricalsService);
  #layer = inject(OLLayerImageComponent);
  #map = inject(OLMapComponent);

  constructor() {
    effect(() => {
      // 👇 find the metadata
      const historicalMap = this.#historicals
        .historicalsFor(this.#map.path())
        .find((historical) => historical.name === this.map());
      // 👇 this is the boundary we will clip to
      const coords: any = copy(
        this.#map.boundary().features[0].geometry.coordinates
      );
      const boundary = new Feature(new Polygon(coords));
      boundary
        .getGeometry()
        .transform(this.#map.featureProjection, this.#map.projection);
      // 👇 this is the edge that will be feathered
      let feathered;
      if (historicalMap.feathered) {
        const buffered: any = buffer(
          copy(this.#map.boundary().features[0]),
          historicalMap.featherWidth[0],
          {
            units: historicalMap.featherWidth[1]
          }
        ).geometry.coordinates;
        feathered = new Feature(new Polygon(buffered));
        feathered
          .getGeometry()
          .transform(this.#map.featureProjection, this.#map.projection);
      }
      // 👇 create the image source
      if (historicalMap) {
        this.olImage = new OLImage(<any>{
          imageCenter: historicalMap.center,
          imageFeather: historicalMap.feathered
            ? feathered.getGeometry().getCoordinates()[0]
            : null,
          imageFeatherFilter: historicalMap.featherFilter,
          imageMask: historicalMap.masked
            ? boundary.getGeometry().getCoordinates()[0]
            : null,
          imageFilter: historicalMap.filter,
          imageRotate: historicalMap.rotate,
          imageScale: historicalMap.scale,
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
