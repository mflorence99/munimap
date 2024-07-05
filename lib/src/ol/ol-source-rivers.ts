import { RiverProperties } from "../common";
import { OLSourceArcGISComponent } from "./ol-source-arcgis";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { Coordinate } from "ol/coordinate";

import copy from "fast-copy";

const attribution =
  '<a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

// 👇 we replaced rivers.geojson with this data source, as it has a
//    LOT more data -- we just need to adapt the properties to match

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-source-rivers",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
})
export class OLSourceRiversComponent extends OLSourceArcGISComponent {
  // 👇 see PlaceProperties

  override filter(arcgis: any): any {
    if (arcgis) {
      arcgis.features.forEach((feature) => {
        const properties: RiverProperties = feature.attributes;
        properties.name = properties.GNIS_Name;
        properties.type = "stream";
      });
      const filtered = copy(arcgis);
      filtered.features = arcgis.features.filter(
        (feature) => !!feature.attributes.name,
      );
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
    return "rivers";
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://nhgeodata.unh.edu/nhgeodata/rest/services/IWR/WaterResources/MapServer/6/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
