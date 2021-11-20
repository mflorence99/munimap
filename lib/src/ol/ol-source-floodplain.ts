import { OLLayerVectorComponent } from './ol-layer-vector';
import { Params } from '../services/params';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

import { arcgisToGeoJSON } from '@terraformer/arcgis';
import { bbox } from 'ol/loadingstrategy';
import { map } from 'rxjs';

import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

const attribution =
  '<a href="https://nhdeswppt.unh.edu" target="_blank">NHDES</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-floodplain',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceFloodplainComponent {
  olVector: OLVector<any>;

  constructor(
    private http: HttpClient,
    private layer: OLLayerVectorComponent,
    private params: Params
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
    [minX, minY, maxX, maxY],
    resolution: number,
    _projection: OLProjection,
    success: Function,
    _failure: Function
  ): void {
    const url = `https://gis.des.nh.gov/server/rest/services/Projects_LRM/Wetlands_Permit_Planning_PRA_NotRestricted/MapServer/0/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100&quantizationParameters={"mode":"view","originPosition":"upperLeft","tolerance":2.388657133974512}`;
    // 👇 the proxy path is strictly for the logs only
    this.http
      .get(
        `${this.params.geoJSON.host}/proxy/floodplain?url=${encodeURIComponent(
          url
        )}`,
        {
          headers: new HttpHeaders({ cache: 'page' })
        }
      )
      .pipe(
        map(
          (arcgis: any): GeoJSON.FeatureCollection<GeoJSON.Polygon> =>
            arcgisToGeoJSON(arcgis)
        )
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
}
