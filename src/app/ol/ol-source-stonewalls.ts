import { GeoJSONService } from '../services/geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ActivatedRoute } from '@angular/router';
import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Input } from '@angular/core';

import { map } from 'rxjs';
import { switchMap } from 'rxjs';
import { transformExtent } from 'ol/proj';

import GeoJSON from 'ol/format/GeoJSON';
import OLVector from 'ol/source/Vector';

const attribution =
  '<a href="https://www.facebook.com/groups/NHstonewalls/" target="_blank">NH Stone Wall</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-stonewalls',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceStoneWallsComponent implements AfterContentInit {
  @Input() layerKey: string;

  olVector: OLVector<any>;

  @Input() path: string;

  constructor(
    private geoJSON: GeoJSONService,
    private http: HttpClient,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private route: ActivatedRoute
  ) {
    this.olVector = new OLVector({ features: null });
  }

  ngAfterContentInit(): void {
    this.geoJSON
      .loadByIndex(this.route, this.path ?? this.map.path, 'boundary')
      .pipe(
        switchMap((geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
          const bbox = geojson.features[0].bbox;
          const featureProjection = geojson['crs'].properties.name;
          const [minX, minY, maxX, maxY] = transformExtent(
            bbox,
            featureProjection,
            this.map.projection
          );
          // 👉 see proxy.conf.js for now
          return this.http.get(
            `/stonewalls/MAcUimSes4gPY4sM/arcgis/rest/services/NH_Stone_Walls_Layer_Public_View/FeatureServer/0/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100&resultType=tile`,
            {
              headers: new HttpHeaders({ cache: 'page' })
            }
          );
        }),
        // 👉 we have no typings for the ESRI format
        map(
          (arcgis: any): GeoJSON.FeatureCollection<GeoJSON.LineString> => ({
            features: arcgis.features.map((feature: any) => ({
              geometry: {
                coordinates: feature.geometry.paths[0],
                type: 'LineString'
              },
              type: 'Feature'
            })),
            type: 'FeatureCollection'
          })
        )
      )
      .subscribe((geojson: GeoJSON.FeatureCollection<GeoJSON.LineString>) => {
        this.olVector.addFeatures(new GeoJSON().readFeatures(geojson));
        this.olVector.setAttributions([attribution]);
        this.layer.olLayer.setSource(this.olVector);
      });
  }
}
