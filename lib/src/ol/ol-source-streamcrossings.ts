import { CacheService } from '../services/cache';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';
import { StreamCrossingProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';

const attribution =
  'Powered by <a href="https://www.des.nh.gov/" target="_blank">NHSADES</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-streamcrossings',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceStreamCrossingsComponent extends OLSourceArcGISComponent {
  constructor(
    cache: CacheService,
    map: OLMapComponent,
    http: HttpClient,
    layer: OLLayerVectorComponent
  ) {
    super(cache, http, layer, map);
  }

  // 👇 see BridgeProperties

  filter(arcgis: any): any {
    if (arcgis) {
      arcgis.features.forEach((feature) => {
        const properties: StreamCrossingProperties = feature.attributes;
        properties.name = properties.AssetType || properties.StructType;
        properties.type = 'stream crossing';
      });
      return arcgis;
    } else return super.filter(arcgis);
  }

  getAttribution(): string {
    return attribution;
  }

  getFeatureID(feature: GeoJSON.Feature<any>): string {
    return feature.properties.OBJECTID;
  }

  getProxyPath(): string {
    return 'streamcrossings';
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://services3.arcgis.com/mB6GMjOL4lVKAyZO/ArcGIS/rest/services/SADES_Stream_Crossings_2021_AOP/FeatureServer/0/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100&where=CrossType<>'Drainage'`;
  }
}
