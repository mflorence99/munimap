import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';
import { Params } from '../services/params';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';

import { all } from 'ol/loadingstrategy';

const attribution =
  'Powered by <a href="https://nhdeswppt.unh.edu" target="_blank">NHDES</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-floodplain',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceFloodplainComponent extends OLSourceArcGISComponent {
  constructor(
    private map: OLMapComponent,
    http: HttpClient,
    layer: OLLayerVectorComponent,
    params: Params
  ) {
    super(http, layer, params);
  }

  getAttribution(): string {
    return attribution;
  }

  getFeatureID(feature: GeoJSON.Feature<any>): string {
    return feature.properties.NWI_ID;
  }

  getLoadingStrategy(): any {
    return all;
  }

  getProxyPath(): string {
    return 'floodplain';
  }

  getURL(_extent: Coordinate): string {
    // 👉 we're going to grab everything at once, as the data is sparse,
    //    meaning that we can cache the result
    const [minX, minY, maxX, maxY] = this.map.boundaryExtent;
    return `https://gis.des.nh.gov/server/rest/services/Projects_LRM/Wetlands_Permit_Planning_PRA_NotRestricted/MapServer/0/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
