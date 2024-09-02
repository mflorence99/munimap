import { LabelProperties } from "../common";
import { OLSourceArcGISComponent } from "./ol-source-arcgis";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { Coordinate } from "ol/coordinate";

import { input } from "@angular/core";

import copy from "fast-copy";

type LabelLayerType = "conservation" | "stream";

const LABELS: {
  [key in LabelLayerType]?: { place: string; url: string };
} = {
  conservation: {
    url: "https://nhgeodata.unh.edu/nhgeodata/rest/services/Topical/GV_Labels/MapServer/21/query",
    place: "park"
  },
  // 🔥 stream labels are really promising but the data coverage
  //    is too limited -- ol-source-rivers is much better
  stream: {
    url: "https://nhgeodata.unh.edu/nhgeodata/rest/services/Topical/GV_ExtractDataLayers/MapServer/17/query",
    place: "stream"
  }
};

const attribution =
  '<a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-source-labels",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"]
})
export class OLSourceLabelsComponent extends OLSourceArcGISComponent {
  dedupe = input<boolean>();
  labelsFor = input<LabelLayerType>();

  // 👇 see PlaceProperties

  override filter(arcgis: any): any {
    if (arcgis) {
      arcgis.features.forEach((feature) => {
        const properties: LabelProperties = feature.attributes;
        properties.name = properties.NAME;
        properties.type = LABELS[this.labelsFor()].place as any;
      });
      // 👇 sometimes adjacent features are duplicated
      const unique = new Set();
      const filtered = copy(arcgis);
      filtered.features = arcgis.features
        .filter((feature) => !!feature.attributes.name)
        .filter((feature) => {
          const exists = unique.has(feature.attributes.name);
          unique.add(feature.attributes.name);
          return !this.dedupe() || !exists;
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
    return `${this.labelsFor()}-labels`;
  }

  getURL(extent: Coordinate): string {
    const [minX, minY, maxX, maxY] = extent;
    return `${
      LABELS[this.labelsFor()].url
    }/query?f=json&returnIdsOnly=false&returnCountOnly=false&where=1=1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100`;
  }
}
