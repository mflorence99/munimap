import { HistoricalMap } from "../common";
import { OLLayerImageComponent } from "./ol-layer-image";
import { OLMapComponent } from "./ol-map";

import OLImage from "./ol-source-geoimage";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { effect } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";
import { buffer } from "@turf/buffer";

import copy from "fast-copy";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-source-historicalimage",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
  standalone: false
})
export class OLSourceHistoricalImageComponent {
  historicalMap = input.required<HistoricalMap>();
  // @ts-ignore 🔥 WTF???
  olImage: OLImage;

  #layer = inject(OLLayerImageComponent);
  #map = inject(OLMapComponent);

  constructor() {
    effect(() => {
      const historicalMap = this.historicalMap();
      if (historicalMap.type === "image") {
        // 👇 this is the boundary we will clip to
        const coords: any = copy(
          this.#map.boundary().features[0].geometry.coordinates
        );
        const boundary = new Feature(new Polygon(coords));
        boundary
          .getGeometry()
          .transform(this.#map.featureProjection, this.#map.projection);
        // 👇 this is the edge that will be feathered
        let feathered;
        if (historicalMap.feathered) {
          const buffered: any = buffer(
            copy(this.#map.boundary().features[0]),
            historicalMap.featherWidth[0],
            {
              units: historicalMap.featherWidth[1]
            }
          ).geometry.coordinates;
          feathered = new Feature(new Polygon(buffered));
          feathered
            .getGeometry()
            .transform(this.#map.featureProjection, this.#map.projection);
        }
        // 👇 create the image source
        this.olImage = new OLImage(<any>{
          attributions: [historicalMap.attribution],
          imageCenter: historicalMap.center,
          imageFeather: historicalMap.feathered
            ? feathered.getGeometry().getCoordinates()[0]
            : null,
          imageFeatherFilter: historicalMap.featherFilter,
          imageMask: historicalMap.masked
            ? boundary.getGeometry().getCoordinates()[0]
            : null,
          imageFilter: historicalMap.filter,
          imageRotate: historicalMap.rotate,
          imageScale: historicalMap.scale,
          projection: "EPSG:3857",
          url: historicalMap.url
        });
        this.olImage.setProperties({ component: this }, true);
        this.#layer.olLayer.setSource(this.olImage);
      }
    });
  }
}
