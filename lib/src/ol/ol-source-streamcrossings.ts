import { StreamCrossingProperties } from "../common";
import { OLSourceArcGISComponent } from "./ol-source-arcgis";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { Coordinate } from "ol/coordinate";

const attribution =
  '<a href="https://www.des.nh.gov/" target="_blank">NHSADES</a>';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-ol-source-streamcrossings",
    template: "<ng-content></ng-content>",
    styles: [":host { display: none }"],
    standalone: false
})
export class OLSourceStreamCrossingsComponent extends OLSourceArcGISComponent {
  // 👇 see BridgeProperties

  override filter(arcgis: any): any {
    if (arcgis) {
      arcgis.features.forEach((feature) => {
        const properties: StreamCrossingProperties = feature.attributes;
        properties.type = "stream crossing";
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
    return "streamcrossings";
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `https://services3.arcgis.com/mB6GMjOL4lVKAyZO/ArcGIS/rest/services/SADES_Stream_Crossings_2021_AOP/FeatureServer/0/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100&where=CrossType<>'Drainage'`;
  }
}
