import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';

import { bbox } from 'ol/loadingstrategy';

const attribution =
  'Powered by <a href="https://www.facebook.com/groups/NHstonewalls/" target="_blank">NH Stone Wall</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-stonewalls',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceStoneWallsComponent extends OLSourceArcGISComponent {
  constructor(
    private map: OLMapComponent,
    http: HttpClient,
    layer: OLLayerVectorComponent
  ) {
    super(http, layer);
  }

  // 👇 we don't even try to load the stonewalls below zoom 16
  //    as the API will try to load as many as it can up to 4000
  //    which takes a LONG time -- and below 16 we can't see them anyeway

  canLoad(_extent: Coordinate): boolean {
    return this.map.olView.getZoom() >= 16;
  }

  getAttribution(): string {
    return attribution;
  }

  getFeatureID(feature: GeoJSON.Feature<any>): string {
    return feature.properties.OBJECTID;
  }

  getLoadingStrategy(): any {
    return bbox;
  }

  getProxyPath(): string {
    return 'stonewalls';
  }

  getURL(extent: Coordinate): string {
    // 👉 we're going to quantize the extent to 500m accuracy
    //    so that we can cache the result
    const minX = Math.floor(extent[0] / 500) * 500;
    const minY = Math.floor(extent[1] / 500) * 500;
    const maxX = Math.ceil(extent[2] / 500) * 500;
    const maxY = Math.ceil(extent[3] / 500) * 500;
    return `https://services1.arcgis.com/MAcUimSes4gPY4sM/arcgis/rest/services/NH_Stone_Walls_Layer_Public_View/FeatureServer/0/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100&resultType=tile`;
  }
}
