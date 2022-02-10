import { CacheService } from '../services/cache';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';
import { Input } from '@angular/core';

// 👇 we replaced railroads.geojson with this data source

const attribution =
  'Powered by <a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-railroads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceRailroadsComponent extends OLSourceArcGISComponent {
  @Input() exclude: string[];

  constructor(
    cache: CacheService,
    map: OLMapComponent,
    http: HttpClient,
    layer: OLLayerVectorComponent
  ) {
    super(cache, http, layer, map);
  }

  // 👇 see RailroadProperties

  filter(arcgis: any): any {
    // 🔥 keep this b/c it helps see what's in the raw data
    // const unique = new Set();
    // arcgis.features.forEach((feature: any) =>
    //   unique.add(feature.attributes.STATUS)
    // );
    // console.log(Array.from(unique).sort());
    if (arcgis) {
      arcgis.features.forEach((feature) => {
        feature.attributes.name = feature.attributes.NAME;
        feature.attributes.active = feature.attributes.STATUS === 'Active';
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
    return 'railroads';
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://nhgeodata.unh.edu/nhgeodata/rest/services/Topical/GV_BaseLayers/MapServer/11/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
