import { CacheService } from '../services/cache';
import { FloodHazardProperties } from '../common';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';

const attribution =
  '<a href="https://www.des.nh.gov/" target="_blank">NHSADES</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-floodhazards',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceFloodHazardsComponent extends OLSourceArcGISComponent {
  constructor(
    cache: CacheService,
    map: OLMapComponent,
    http: HttpClient,
    layer: OLLayerVectorComponent
  ) {
    super(cache, http, layer, map);
  }

  // 👇 see FloodHazardProperties

  override filter(arcgis: any): any {
    if (arcgis) {
      arcgis.features.forEach((feature) => {
        const properties: FloodHazardProperties = feature.attributes;
        properties.name = '' /* 👈 ??? */;
        properties.type = 'flood hazard';
      });
      return arcgis;
    } else return super.filter(arcgis);
  }

  getAttribution(): string {
    return attribution;
  }

  getFeatureID(feature: GeoJSON.Feature<any>): string {
    return feature.properties.GlobalID;
  }

  getProxyPath(): string {
    return 'floodhazards';
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://services1.arcgis.com/MAcUimSes4gPY4sM/arcgis/rest/services/NH_FloodHazards_Service_2021_Points_Final/FeatureServer/0/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
