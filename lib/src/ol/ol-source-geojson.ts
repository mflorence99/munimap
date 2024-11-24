import { GeoJSONService } from "../services/geojson";
import { OLLayerVectorComponent } from "./ol-layer-vector";
import { OLMapComponent } from "./ol-map";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { Coordinate } from "ol/coordinate";

import { inject } from "@angular/core";
import { input } from "@angular/core";
import { all as allStrategy } from "ol/loadingstrategy";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import { transformExtent } from "ol/proj";
import { map } from "rxjs/operators";

import copy from "fast-copy";
import OLFeature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import OLProjection from "ol/proj/Projection";
import OLVector from "ol/source/Vector";

const attribution =
  '<a href="https://www.granit.unh.edu/data/downloadfreedata/alphabetical/databyalpha.html" target="_blank">NH GRANIT</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-source-geojson",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
  standalone: false
})
export class OLSourceGeoJSONComponent {
  exclude = input<(number | string)[]>();
  layerKey = input<string>();
  olVector: OLVector<any>;
  path = input<string>();

  #geoJSON = inject(GeoJSONService);
  #layer = inject(OLLayerVectorComponent);
  #map = inject(OLMapComponent);

  constructor() {
    let strategy;
    if (this.#map.loadingStrategy() === "all") strategy = allStrategy;
    else if (this.#map.loadingStrategy() === "bbox") strategy = bboxStrategy;
    this.olVector = new OLVector({
      attributions: [attribution],
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: strategy
    });
    this.olVector.setProperties({ component: this }, true);
    this.#layer.olLayer.setSource(this.olVector);
  }

  #loader(
    extent: Coordinate,
    resolution: number,
    projection: OLProjection,
    success: Function
  ): void {
    let bbox;
    // 👉 get everything at once
    if (this.#map.loadingStrategy() === "all") bbox = this.#map.bbox();
    // 👉 or just get what's visible
    else if (this.#map.loadingStrategy() === "bbox")
      bbox = transformExtent(extent, projection, this.#map.featureProjection);
    this.#geoJSON
      .loadByIndex(this.path() ?? this.#map.path(), this.layerKey(), bbox)
      .pipe(
        map((geojson: GeoJSON.FeatureCollection<any, any>) => {
          if (this.exclude()) {
            const filtered = copy(geojson);
            // 🔥 this is a hack implementation but is easily expanded
            //    if necessary to support include and/or filtering
            //    on a field other than "type"
            filtered.features = geojson.features.filter(
              (feature: any) =>
                !this.exclude().includes(feature.properties.type)
            );
            return filtered;
          } else return geojson;
        })
      )
      .subscribe((geojson: GeoJSON.FeatureCollection<any, any>) => {
        // 👉 convert features into OL format
        const features = this.olVector.getFormat().readFeatures(geojson, {
          featureProjection: this.#map.projection
        }) as OLFeature<any>[];
        // 👉 add each feature not already present
        features.forEach((feature) => {
          if (!this.olVector.hasFeature(feature))
            this.olVector.addFeature(feature);
        });
        success(features);
      });
  }
}
