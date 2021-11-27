import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';

import { all } from 'ol/loadingstrategy';

const attribution =
  'Powered by <a href="https://nhdeswppt.unh.edu" target="_blank">NHDES</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-peatland',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourcePeatlandComponent extends OLSourceArcGISComponent {
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
    return feature.properties.OBJECTID;
  }

  getLoadingStrategy(): any {
    return all;
  }

  getProxyPath(): string {
    return 'peatland';
  }

  getURL(_extent: Coordinate): string {
    // 👉 we're going to grab everything at once, as the data is sparse,
    //    meaning that we can cache the result
    const [minX, minY, maxX, maxY] = this.map.boundaryExtent;
    return `https://nhgeodata.unh.edu/nhgeodata/rest/services/EC/NHWAP_2020/MapServer/1/query?f=json&where=WAP_HAB='Peatland'&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
