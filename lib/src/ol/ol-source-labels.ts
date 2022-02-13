import { CacheService } from '../services/cache';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLSourceArcGISComponent } from './ol-source-arcgis';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';
import { Input } from '@angular/core';

import copy from 'fast-copy';

type LabelLayerType = 'conservation';

const LABELS: {
  [key in LabelLayerType]?: { layer: number; place: string };
} = {
  conservation: { layer: 21, place: 'park' }
};

const attribution =
  'Powered by <a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-labels',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceLabelsComponent extends OLSourceArcGISComponent {
  @Input() labelsFor: LabelLayerType;

  constructor(
    cache: CacheService,
    map: OLMapComponent,
    http: HttpClient,
    layer: OLLayerVectorComponent
  ) {
    super(cache, http, layer, map);
  }

  // 👇 see PlaceProperties
  // https://tile.openstreetmap.org/16/19642/24029.png

  filter(arcgis: any): any {
    if (arcgis) {
      arcgis.features.forEach((feature) => {
        feature.attributes.name = feature.attributes.NAME;
        feature.attributes.type = LABELS[this.labelsFor].place;
      });
      // 👇 sometimes adjacent features are duplicated
      const unique = new Set();
      const filtered = copy(arcgis);
      filtered.features = arcgis.features.filter((feature) => {
        const exists = unique.has(feature.attributes.name);
        unique.add(feature.attributes.name);
        return !exists;
      });
      return filtered;
    } else return super.filter(arcgis);
  }

  getAttribution(): string {
    return attribution;
  }

  getFeatureID(feature: GeoJSON.Feature<any>): string {
    return feature.properties.OBJECTID;
  }

  getProxyPath(): string {
    return 'labels';
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://nhgeodata.unh.edu/nhgeodata/rest/services/Topical/GV_Labels/MapServer/${
      LABELS[this.labelsFor].layer
    }/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
