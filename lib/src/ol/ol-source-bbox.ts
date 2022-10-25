import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';

import { all as allStrategy } from 'ol/loadingstrategy';

import bboxPolygon from '@turf/bbox-polygon';
import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-bbox',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceBBoxComponent {
  olVector: OLVector<any>;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.olVector = new OLVector({
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: allStrategy
    });
    this.olVector.setProperties({ component: this }, true);
    this.layer.olLayer.setSource(this.olVector);
  }

  // 👇 a simple loader allows refresh to be called

  #loader(
    extent: Coordinate,
    resolution: number,
    projection: OLProjection,
    success: Function
  ): void {
    // 👉 convert features into OL format
    console.log({ bbox: this.map.bbox });
    const features = this.olVector.getFormat().readFeatures(
      {
        features: [bboxPolygon(this.map.bbox as any)],
        type: 'FeatureCollection'
      },
      {
        featureProjection: this.map.projection
      }
    ) as OLFeature<any>[];
    // 👉 add feature to source
    this.olVector.addFeatures(features);
    success(features);
  }
}
