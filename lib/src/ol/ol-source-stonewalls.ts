import { CacheService } from '../services/cache';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';

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
    cache: CacheService,
    map: OLMapComponent,
    http: HttpClient,
    layer: OLLayerVectorComponent
  ) {
    super(cache, http, layer, map);
  }

  getAttribution(): string {
    return attribution;
  }

  getFeatureID(feature: GeoJSON.Feature<any>): string {
    return feature.properties.OBJECTID;
  }

  getProxyPath(): string {
    return 'stonewalls';
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://services1.arcgis.com/MAcUimSes4gPY4sM/arcgis/rest/services/NH_Stone_Walls_Layer_Public_View/FeatureServer/0/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100&resultType=tile`;
  }
}
