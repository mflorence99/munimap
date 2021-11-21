import { OLLayerVectorComponent } from './ol-layer-vector';
import { Params } from '../services/params';

import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

import { arcgisToGeoJSON } from '@terraformer/arcgis';
import { bbox } from 'ol/loadingstrategy';
import { map } from 'rxjs';
import { tap } from 'rxjs';

import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

@Component({ template: '' })
export abstract class OLSourceArcGISComponent {
  olVector: OLVector<any>;

  constructor(
    private http: HttpClient,
    private layer: OLLayerVectorComponent,
    private params: Params
  ) {
    this.olVector = new OLVector({
      attributions: [this.getAttribution()],
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: bbox
    });
    this.layer.olLayer.setSource(this.olVector);
  }

  #loader(
    extent: Coordinate,
    resolution: number,
    projection: OLProjection,
    success: Function
  ): void {
    // 👇 the proxy path is strictly for the logs only
    this.http
      .get(
        `${
          this.params.geoJSON.host
        }/proxy/${this.getProxyPath()}?url=${encodeURIComponent(
          this.getURL(extent)
        )}`,
        {
          headers: new HttpHeaders({ cache: 'page' })
        }
      )
      .pipe(
        map(
          (arcgis: any): GeoJSON.FeatureCollection<GeoJSON.Polygon> =>
            arcgisToGeoJSON(arcgis)
        ),
        tap((geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
          geojson.features.forEach(
            (feature) => (feature.id = feature.properties.NWI_ID)
          );
        })
      )
      .subscribe((geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
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

  abstract getProxyPath(): string;

  abstract getURL(extent: Coordinate): string;
}
