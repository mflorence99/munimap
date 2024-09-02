import { DestroyService } from "../services/destroy";
import { OLLayerVectorComponent } from "./ol-layer-vector";
import { OLMapComponent } from "./ol-map";

import { EventsKey as OLEventsKey } from "ol/events";
import { Observable } from "rxjs";

import { inject } from "@angular/core";
import { outputToObservable } from "@angular/core/rxjs-interop";
import { cleanCoords } from "@turf/clean-coords";
import { unByKey } from "ol/Observable";
import { click } from "ol/events/condition";
import { platformModifierKeyOnly } from "ol/events/condition";
import { merge } from "rxjs";
import { takeUntil } from "rxjs/operators";

import copy from "fast-copy";
import OLCollection from "ol/Collection";
import OLFeature from "ol/Feature";
import OLGeoJSON from "ol/format/GeoJSON";
import OLLineString from "ol/geom/LineString";
import OLPolygon from "ol/geom/Polygon";
import OLModify from "ol/interaction/Modify";
import OLSnap from "ol/interaction/Snap";

export abstract class OLInteractionAbstractRedrawComponent {
  feature: OLFeature<OLLineString | OLPolygon>;
  geometry: OLLineString | OLPolygon;

  olModify: OLModify;
  olSnap: OLSnap;

  #destroy$ = inject(DestroyService);
  #format: OLGeoJSON;
  #layer = inject(OLLayerVectorComponent);
  #map = inject(OLMapComponent);
  #modifyStartKey: OLEventsKey;
  #touched = false;

  constructor() {
    this.#format = new OLGeoJSON({
      dataProjection: this.#map.featureProjection,
      featureProjection: this.#map.projection
    });
  }

  onDestroy(): void {
    this.#unsetFeature();
  }

  onInit(): void {
    this.#handleStreams$();
  }

  resetRedraw(): void {
    this.feature.setGeometry(this.geometry);
    this.#layer.olLayer.getSource().refresh();
  }

  // 👉 setFeature is called by the contextmenu code to initiate
  //    this interaction

  setFeature(feature: OLFeature<OLLineString | OLPolygon>): void {
    this.feature = feature;
    // 🔥 pretty hack back door -- see ol-style-parcels.ts
    this.feature.set("ol-interaction-redraw", true);
    // 👇 copy the geometry so we can restore it if redraw cancelled
    this.geometry = copy(feature.getGeometry());
    // 👇 create a standard OL Modify interaction
    const features = new OLCollection([feature]);
    this.olModify = new OLModify({
      deleteCondition: (event): boolean =>
        click(event) && platformModifierKeyOnly(event),
      features
      // 🔥 why does thus no longer work?
      // hitDetection: this.#layer.olLayer
    });
    this.#modifyStartKey = this.olModify.on(
      "modifystart",
      () => (this.#touched = true)
    );
    this.#map.olMap.addInteraction(this.olModify);
    // 👇 create a standard OL Snap interaction
    this.olSnap = new OLSnap({ source: this.#layer.olLayer.getSource() });
    this.#map.olMap.addInteraction(this.olSnap);
  }

  // 👇 the idea is that a selection change or ESC accepts the redraw

  #handleStreams$(): void {
    merge(this.#map.escape$, outputToObservable(this.#map.featuresSelected))
      .pipe(takeUntil(this.#destroy$))
      .subscribe(() => {
        if (this.#touched) {
          const geojson = JSON.parse(this.#format.writeFeature(this.feature));
          this.saveRedraw(cleanCoords(geojson)).subscribe(() =>
            this.#unsetFeature()
          );
        } else this.#unsetFeature();
      });
  }

  #unsetFeature(): void {
    if (this.#modifyStartKey) unByKey(this.#modifyStartKey);
    if (this.olModify) this.#map.olMap.removeInteraction(this.olModify);
    if (this.olSnap) this.#map.olMap.removeInteraction(this.olSnap);
    if (this.feature) this.feature.set("ol-interaction-redraw", false);
    this.#modifyStartKey = null;
    this.olModify = null;
    this.olSnap = null;
    this.feature = null;
    this.#touched = false;
  }

  abstract saveRedraw(feature: GeoJSON.Feature<any>): Observable<boolean>;
}
