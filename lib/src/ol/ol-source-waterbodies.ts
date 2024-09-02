import { WaterbodyProperties } from "../common";
import { OLSourceArcGISComponent } from "./ol-source-arcgis";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { Coordinate } from "ol/coordinate";

import { input } from "@angular/core";

import copy from "fast-copy";

// 👇 we replaced lakes.geojson with this data source
//    as it has a LOT more data

const attribution =
  '<a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-source-waterbodies",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"]
})
export class OLSourceWaterbodiesComponent extends OLSourceArcGISComponent {
  exclude = input<(number | string)[]>();

  override filter(arcgis: any): any {
    if (arcgis && this.exclude()) {
      const filtered = copy(arcgis);
      filtered.features = arcgis.features.filter((feature) => {
        const properties: WaterbodyProperties = feature.attributes;
        return !this.exclude().includes(properties.FType);
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
    return "waterbodies";
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://nhgeodata.unh.edu/nhgeodata/rest/services/IWR/WaterResources/MapServer/9/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
