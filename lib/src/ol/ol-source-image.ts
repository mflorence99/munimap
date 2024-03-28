import { OLLayerImageComponent } from './ol-layer-image';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { inject } from '@angular/core';
import { input } from '@angular/core';

import copy from 'fast-copy';
import Feature from 'ol/Feature';
import OLImage from 'ol-ext/source/GeoImage';
import Polygon from 'ol/geom/Polygon';

// 🔥 EXPERIMENTAL

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-image',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceImageComponent {
  maxZoom = input(13);
  minZoom = input(9);
  olImage: OLImage;

  #layer = inject(OLLayerImageComponent);
  #map = inject(OLMapComponent);

  constructor() {
    // 👇 build the mask
    const coords: any = copy(
      this.#map.boundary().features[0].geometry.coordinates
    );
    const boundary = new Feature(new Polygon(coords));
    boundary
      .getGeometry()
      .transform(this.#map.featureProjection, this.#map.projection);
    // 👇 create the image source
    this.olImage = new OLImage({
      imageCenter: [-8025997.293870849, 5340620.884998821],
      imageMask: boundary.getGeometry().getCoordinates()[0],
      imageRotate: 0.007905564049453249,
      imageScale: [6.989846366579601, 6.989846366579913],
      maxZoom: this.maxZoom(),
      minZoom: this.minZoom(),
      projection: 'EPSG:3857',
      url: `${environment.endpoints.proxy}/historical/1930/1930-3000w.jpeg`
    });
    this.olImage.setProperties({ component: this }, true);
    this.#layer.olLayer.setSource(this.olImage);
  }
}
