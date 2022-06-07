import { CacheService } from '../services/cache';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { dedupe } from '../common';
import { environment } from '../environment';

import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';
import { Input } from '@angular/core';

import { all as allStrategy } from 'ol/loadingstrategy';
import { arcgisToGeoJSON } from '@esri/arcgis-to-geojson-utils';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { catchError } from 'rxjs/operators';
import { delay } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { merge } from 'rxjs';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { toArray } from 'rxjs/operators';
import { transformExtent } from 'ol/proj';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import booleanIntersects from '@turf/boolean-intersects';
import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

// 👇 we don't care about the ArcGIS schema as defined in
//    @arcgis/core because we immediately convert it to GeoJSON

@Component({ template: '' })
export abstract class OLSourceArcGISComponent {
  static schemaAlreadyAnalyzed: Record<string, boolean> = {};

  @Input() maxRequests = 8;

  olVector: OLVector<any>;

  constructor(
    private cache: CacheService,
    private http: HttpClient,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    let strategy;
    if (this.map.loadingStrategy === 'all') strategy = allStrategy;
    else if (this.map.loadingStrategy === 'bbox') strategy = bboxStrategy;
    this.olVector = new OLVector({
      attributions: [this.getAttribution()],
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: strategy
    });
    this.olVector.setProperties({ component: this }, true);
    this.layer.olLayer.setSource(this.olVector);
  }

  #gridsFromBBox(projection: OLProjection): Coordinate[] {
    const visible = transformExtent(
      this.map.bbox,
      this.map.featureProjection,
      projection
    ) as GeoJSON.BBox;
    return [visible];
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
    let grids: Coordinate[];
    // 👇 get everyrhing at once
    if (this.map.loadingStrategy === 'all')
      grids = this.#gridsFromBBox(projection);
    // 👇 one URL for each grid square covered by the extent
    //    this way requests are repeatable and cachable
    else if (this.map.loadingStrategy === 'bbox')
      grids = this.#gridsFromExtent(extent, projection);
    const urls = grids.map(
      (grid) =>
        `${
          environment.endpoints.proxy
        }/proxy/${this.getProxyPath()}?url=${encodeURIComponent(
          this.getURL(grid)
        )}`
    );
    // 👇 we cache responses by URL
    const requests = urls.map((url) => {
      const cached = this.cache.get(url);
      return cached
        ? // 👇 preserve "next tick" semantics of HTTP GET
          of(cached).pipe(delay(0))
        : this.http.get(url).pipe(
            catchError(() => of({ features: [] })),
            // 👇 arcgis can return just an "error" which we ignore
            map((arcgis: any): any =>
              arcgis?.features ? arcgis : { features: [], fields: [] }
            ),
            tap((arcgis: any) => this.#schema(arcgis)),
            map(
              (arcgis: any): GeoJSON.FeatureCollection<any, any> =>
                arcgisToGeoJSON(this.filter(arcgis))
            ),
            tap((geojson: GeoJSON.FeatureCollection<any, any>) => {
              geojson.features.forEach(
                (feature) => (feature.id = this.getFeatureID(feature))
              );
              this.cache.set(url, geojson);
            })
          );
    });
    // 👇 run the requests with a maximum concurrency
    merge(...requests, this.maxRequests)
      .pipe(
        toArray(),
        map((geojsons: GeoJSON.FeatureCollection<any, any>[]) =>
          dedupe(geojsons)
        )
      )
      .subscribe((geojson: GeoJSON.FeatureCollection<any, any>) => {
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

  #schema(arcgis: any): void {
    if (
      arcgis.fields?.length > 0 &&
      !OLSourceArcGISComponent.schemaAlreadyAnalyzed[this.getProxyPath()]
    ) {
      OLSourceArcGISComponent.schemaAlreadyAnalyzed[this.getProxyPath()] = true;
      const fields = arcgis.fields.sort((p, q) => p.name.localeCompare(q.name));
      const js = fields.map((field) => {
        let type;
        switch (field.type) {
          case 'esriFieldTypeBoolean':
            type = 'boolean';
            break;
          case 'esriFieldTypeDate':
            type = 'Date';
            break;
          case 'esriFieldTypeDouble':
          case 'esriFieldTypeInteger':
            type = 'number';
            break;
          default:
            type = 'string';
            break;
        }
        return `${field.name}: ${type} /* 👈 ${field.alias.trim()} */;`;
      });
      js.unshift(`// 👇 original ${this.getProxyPath()} schema`);
      js.push(`// 👇 translated ${this.getProxyPath()} schema`);
      console.log(`${js.join('\n')}\n`);
    }
  }

  filter(arcgis: any): any {
    return arcgis ?? { features: [] };
  }

  abstract getAttribution(): string;

  abstract getFeatureID(feature: GeoJSON.Feature<any>): string;

  // 👇 the proxy path is strictly for the logs only
  abstract getProxyPath(): string;

  abstract getURL(extent: Coordinate): string;
}
