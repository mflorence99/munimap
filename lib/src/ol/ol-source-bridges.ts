import { BridgeProperties } from '../common';
import { OLSourceArcGISComponent } from './ol-source-arcgis';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';

const attribution =
  '<a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-bridges',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceBridgesComponent extends OLSourceArcGISComponent {
  // 👇 see BridgeProperties

  override filter(arcgis: any): any {
    if (arcgis) {
      arcgis.features.forEach((feature) => {
        const properties: BridgeProperties = feature.attributes;
        properties.name = '' /* 👈 ??? */;
        properties.type = 'bridge';
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
    return 'bridges';
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://nhgeodata.unh.edu/nhgeodata/rest/services/Topical/GV_BaseLayers/MapServer/10/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
