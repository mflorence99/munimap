import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';

import { all } from 'ol/loadingstrategy';

import hash from 'object-hash';

const attribution =
  'Powered by <a href="https://nhdeswppt.unh.edu" target="_blank">NHDES</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-wetland',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceWetlandComponent extends OLSourceArcGISComponent {
  constructor(
    private map: OLMapComponent,
    http: HttpClient,
    layer: OLLayerVectorComponent
  ) {
    super(http, layer);
  }

  getAttribution(): string {
    return attribution;
  }

  getFeatureID(feature: GeoJSON.Feature<any>): string {
    // 👉 wetlands don't appear to have an ID in the ArcGIS data
    //    so let's at least use a hash of the geometry so that
    //    every time we load the same ID is used
    return hash.MD5(feature.geometry);
  }

  getLoadingStrategy(): any {
    return all;
  }

  getProxyPath(): string {
    return 'wetland';
  }

  getURL(_extent: Coordinate): string {
    // 👉 we're going to grab everything at once, as the data is sparse,
    //    meaning that we can cache the result
    const [minX, minY, maxX, maxY] = this.map.boundaryExtent;
    return `https://gis.des.nh.gov/server/rest/services/Projects_LRM/Wetlands_Permit_Planning_PRA_NotRestricted/MapServer/3/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
