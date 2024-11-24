import { OLInteractionSelectParcelsComponent } from "./ol-interaction-selectparcels";
import { OLLayerImageComponent } from "./ol-layer-image";
import { OLLayerTileComponent } from "./ol-layer-tile";
import { OLLayerVectorComponent } from "./ol-layer-vector";
import { OLMapComponent } from "./ol-map";

import * as Sentry from "@sentry/angular-ivy";

import { AfterContentInit } from "@angular/core";
import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { OnDestroy } from "@angular/core";
import { OnInit } from "@angular/core";

import { inject } from "@angular/core";
import { featureCollection } from "@turf/helpers";
import { union } from "@turf/union";

import Crop from "ol-ext/filter/Crop";
import OLGeoJSON from "ol/format/GeoJSON";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-filter-crop2selectedparcels",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
  standalone: false
})
export class OLFilterCrop2SelectedParcelsComponent
  implements AfterContentInit, OnDestroy, OnInit
{
  olFilter: Crop;

  #format: OLGeoJSON;
  #layer: any;
  #layer1 = inject(OLLayerTileComponent, { optional: true });
  #layer2 = inject(OLLayerVectorComponent, { optional: true });
  #layer3 = inject(OLLayerImageComponent, { optional: true });
  #map = inject(OLMapComponent);

  constructor() {
    this.#format = new OLGeoJSON({
      dataProjection: this.#map.featureProjection,
      featureProjection: this.#map.projection
    });
    // 👇 choose which layer parent
    this.#layer = this.#layer1 ?? this.#layer2 ?? this.#layer3;
  }

  ngAfterContentInit(): void {
    this.#addFilter();
  }

  ngOnDestroy(): void {
    // 👇 ol-ext has monkey-patched removeFilter
    this.#layer?.olLayer["removeFilter"](this.olFilter);
  }

  ngOnInit(): void {
    this.#handleFeaturesSelected$();
  }

  #addFilter(): void {
    // 👉 remove prior filter
    if (this.olFilter) this.#layer?.olLayer["removeFilter"](this.olFilter);
    this.olFilter = null;
    // 👉 the selector MAY not be present
    const selector =
      this.#map.selector() as OLInteractionSelectParcelsComponent;
    // 👇 build a new filter as the union of all the selected parcels
    if (selector?.selected?.length > 0) {
      const geojsons = selector.selected.map((feature) =>
        JSON.parse(this.#format.writeFeature(feature))
      );
      const merged: any = {
        geometry: geojsons.reduce((acc, geojson) =>
          union(featureCollection([acc, geojson]))
        ).geometry,
        properties: {},
        type: "Feature"
      };
      // 👇 this may fail!
      try {
        this.olFilter = new Crop({
          feature: this.#format.readFeature(merged),
          inner: false
        });
      } catch (e) {
        const message = `🔥 Crop filter failed for ${selector.selectedIDs} ${e}`;
        console.error(message);
        Sentry.captureMessage(message);
      }
    }
    // 👇 ol-ext has monkey-patched addFilter
    if (this.olFilter) this.#layer?.olLayer["addFilter"](this.olFilter);
  }

  #handleFeaturesSelected$(): void {
    this.#map.featuresSelected.subscribe(() => this.#addFilter());
  }
}
