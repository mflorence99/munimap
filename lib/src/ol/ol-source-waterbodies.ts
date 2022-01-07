import { CacheService } from '../services/cache';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';

import copy from 'fast-copy';

// 👇 we replaced lakes.geojson with this data source
//    as it has a LOT more data

const attribution =
  'Powered by <a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-waterbodies',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceWaterbodiesComponent extends OLSourceArcGISComponent {
  constructor(
    cache: CacheService,
    map: OLMapComponent,
    http: HttpClient,
    layer: OLLayerVectorComponent
  ) {
    super(cache, http, layer, map);
  }

  filter(arcgis: any): any {
    // 🔥 keep this b/c it helps see what's in the raw data
    // const unique = new Set();
    // arcgis.features.forEach((feature: any) =>
    //   unique.add(feature.attributes.FType)
    // );
    // console.log(Array.from(unique).sort());
    // 👇 these waterbody types don't add anything to the map b/c
    //    other features like floodplain already show what
    //    needs to be shown
    const filtered = copy(arcgis);
    const exclude = [466 /* 👈 swamp/marsh */];
    filtered.features = arcgis.features.filter(
      (feature) => !exclude.includes(feature.attributes.FType)
    );
    return filtered;
  }

  getAttribution(): string {
    return attribution;
  }

  getFeatureID(feature: GeoJSON.Feature<any>): string {
    return feature.properties.OBJECTID;
  }

  getProxyPath(): string {
    return 'waterbodies';
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://nhgeodata.unh.edu/nhgeodata/rest/services/IWR/WaterResources/MapServer/9/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}