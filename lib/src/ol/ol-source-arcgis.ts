import { Features } from '../geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';
import { Input } from '@angular/core';

import { arcgisToGeoJSON } from '@terraformer/arcgis';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { merge } from 'rxjs';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { transformExtent } from 'ol/proj';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import booleanIntersects from '@turf/boolean-intersects';
import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

@Component({ template: '' })
export abstract class OLSourceArcGISComponent {
  @Input() maxRequests = 8;

  olVector: OLVector<any>;

  constructor(
    private http: HttpClient,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.olVector = new OLVector({
      attributions: [this.getAttribution()],
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
      .map((feature) => bbox(feature))
      .map((bbox) =>
        transformExtent(bbox, this.map.featureProjection, projection)
      )
      .map((bbox) => {
        const [minX, minY, maxX, maxY] = bbox;
        return [
          Math.round(minX),
          Math.round(minY),
          Math.round(maxX),
          Math.round(maxY)
        ];
      });
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
      this.http.get(
        `${
          environment.endpoints.proxy
        }/proxy/${this.getProxyPath()}?url=${encodeURIComponent(
          this.getURL(grid)
        )}`
      )
    );
    // 👇 run the requests with a maximum concurrency
    merge(...requests, this.maxRequests)
      .pipe(
        catchError(() => of({ features: [] })),
        map((arcgis: any): Features => arcgisToGeoJSON(arcgis)),
        tap((geojson: Features) => {
          geojson.features.forEach(
            (feature) => (feature.id = this.getFeatureID(feature))
          );
        })
      )
      .subscribe((geojson: Features) => {
        // 👉 convert features into OL format
        const features = this.olVector
          .getFormat()
          .readFeatures(geojson) as OLFeature<any>[];
        // 👉 add each feature not already present
        features.forEach((feature) => {
          if (!this.olVector.hasFeature(feature))
            this.olVector.addFeature(feature);
        });
        success(features);
      });
  }

  abstract getAttribution(): string;

  abstract getFeatureID(feature: GeoJSON.Feature<any>): string;

  // 👇 the proxy path is strictly for the logs only
  abstract getProxyPath(): string;

  abstract getURL(extent: Coordinate): string;
}
