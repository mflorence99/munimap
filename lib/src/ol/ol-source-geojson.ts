import { GeoJSONService } from '../services/geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { Input } from '@angular/core';

import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { merge } from 'rxjs';
import { transformExtent } from 'ol/proj';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import booleanIntersects from '@turf/boolean-intersects';
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

  @Input() maxRequests = 8;

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
      strategy: bboxStrategy
    });
    this.layer.olLayer.setSource(this.olVector);
  }

  #gridsFromExtent(extent: Coordinate, projection: OLProjection): Coordinate[] {
    const visible = bboxPolygon(
      transformExtent(
        extent,
        projection,
        this.map.featureProjection
      ) as GeoJSON.BBox
    );
    return this.map.boundaryGrid.features
      .filter((feature) => booleanIntersects(visible, feature))
      .map((feature) => bbox(feature));
  }

  #loader(
    extent: Coordinate,
    resolution: number,
    projection: OLProjection,
    success: Function
  ): void {
    // 👇 one request for each grid square covered by the extent
    //    this way requests are repeatable and cachable
    const grids = this.#gridsFromExtent(extent, projection);
    const requests = grids.map((grid) =>
      this.geoJSON.loadByIndex(
        this.route,
        this.path ?? this.map.path,
        this.layerKey,
        grid
      )
    );
    // 👇 run the requests with a maximum concurrency
    merge(...requests, this.maxRequests).subscribe(
      (geojson: GeoJSON.FeatureCollection<any>) => {
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
      }
    );
  }
}
