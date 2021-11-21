import { OLLayerVectorComponent } from './ol-layer-vector';
import { Params } from '../services/params';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { bbox } from 'ol/loadingstrategy';
import { map } from 'rxjs';

import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

const attribution =
  '<a href="https://www.facebook.com/groups/NHstonewalls/" target="_blank">NH Stone Wall</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-stonewalls',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceStoneWallsComponent {
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
    const url = `https://services1.arcgis.com/MAcUimSes4gPY4sM/arcgis/rest/services/NH_Stone_Walls_Layer_Public_View/FeatureServer/0/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100&resultType=tile`;
    // 👇 the proxy path is strictly for the logs only
    this.http
      .get(
        `${this.params.geoJSON.host}/proxy/stonewalls?url=${encodeURIComponent(
          url
        )}`
      )
      .pipe(
        map(
          (arcgis: any): GeoJSON.FeatureCollection<GeoJSON.LineString> => ({
            features: arcgis.features.map((feature: any) => ({
              geometry: {
                coordinates: feature.geometry.paths[0],
                type: 'LineString'
              },
              id: feature.attributes.OBJECTID,
              type: 'Feature'
            })),
            type: 'FeatureCollection'
          })
        )
      )
      .subscribe((geojson: GeoJSON.FeatureCollection<GeoJSON.LineString>) => {
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
