import { GeoJSONService } from '../services/geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { bbox } from 'ol/loadingstrategy';
import { transformExtent } from 'ol/proj';

import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

const attribution =
  'Powered by <a href="https://www.granit.unh.edu/data/downloadfreedata/alphabetical/databyalpha.html" target="_blank">NH GRANIT</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-geojson',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceGeoJSONComponent {
  @Input() layerKey: string;

  olVector: OLVector<any>;

  @Input() path: string;

  constructor(
    private geoJSON: GeoJSONService,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private route: ActivatedRoute
  ) {
    this.olVector = new OLVector({
      attributions: [attribution],
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: bbox
    });
    this.layer.olLayer.setSource(this.olVector);
  }

  #loader(
    extent: number[],
    _resolution: number,
    projection: OLProjection,
    success: Function,
    _failure: Function
  ): void {
    const bbox = transformExtent(
      extent,
      projection,
      this.map.featureProjection
    );
    this.geoJSON
      .loadByIndex(this.route, this.path ?? this.map.path, this.layerKey, bbox)
      .subscribe((geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
        // 👉 convert features into OL format
        const features = this.olVector.getFormat().readFeatures(geojson, {
          featureProjection: this.map.projection
        }) as OLFeature<any>[];
        // 👉 add each feature not already present
        features.forEach((feature) => {
          if (!this.olVector.hasFeature(feature))
            this.olVector.addFeature(feature);
        });
        success(features);
      });
  }
}
