import { LandmarkID } from "../common";
import { Parcel } from "../common";
import { OLLayerVectorComponent } from "./ol-layer-vector";
import { OLMapComponent } from "./ol-map";
import { Mapable } from "./ol-mapable";
import { MapableComponent } from "./ol-mapable";
import { Selector } from "./ol-selector";
import { SelectorComponent } from "./ol-selector";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { OnDestroy } from "@angular/core";
import { OnInit } from "@angular/core";
import { EventsKey as OLEventsKey } from "ol/events";
import { SelectEvent as OLSelectEvent } from "ol/interaction/Select";
import { StyleFunction as OLStyleFunction } from "ol/style/Style";

import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";
import { output } from "@angular/core";
import { unByKey } from "ol/Observable";
import { click } from "ol/events/condition";
import { never } from "ol/events/condition";
import { platformModifierKeyOnly } from "ol/events/condition";
import { pointerMove } from "ol/events/condition";
import { shiftKeyOnly } from "ol/events/condition";
import { extend } from "ol/extent";
import { transformExtent } from "ol/proj";

import Debounce from "debounce-decorator";
import OLFeature from "ol/Feature";
import OLSelect from "ol/interaction/Select";
import OLLayer from "ol/layer/Layer";
import OLStyle from "ol/style/Style";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: MapableComponent,
            useExisting: forwardRef(() => OLInteractionSelectLandmarksComponent)
        },
        {
            provide: SelectorComponent,
            useExisting: forwardRef(() => OLInteractionSelectLandmarksComponent)
        }
    ],
    selector: "app-ol-interaction-selectlandmarks",
    template: "<ng-content></ng-content>",
    styles: [":host { display: none }"],
    standalone: false
})
export class OLInteractionSelectLandmarksComponent
  implements Mapable, OnDestroy, OnInit, Selector
{
  featuresSelected = output<OLFeature<any>[]>();

  // 👉 we need public access to go through the selector to its layer
  //    see abstract-map.ts -- this is how the context menu works
  //    the layer that contains the selector contains the features
  //    that can be operated on
  layer = inject(OLLayerVectorComponent);

  layers = input<OLLayerVectorComponent[]>();
  maxZoom = input(19);
  multi = input<boolean>();
  olHover: OLSelect;
  olSelect: OLSelect;
  zoomAnimationDuration = input(200);

  #map = inject(OLMapComponent);
  #selectKey: OLEventsKey;

  constructor() {
    const whichLayers = (olLayer: OLLayer): boolean => {
      const layers = this.layers() ?? [this.layer];
      return layers.some((layer) => layer.olLayer === olLayer);
    };
    // 👉 for hovering
    this.olHover = new OLSelect({
      condition: (event): boolean => pointerMove(event),
      // 👇 don't hover over something that's already selected
      filter: (feature): boolean => !this.selectedIDs.includes(feature.getId()),
      layers: whichLayers,
      style: this.#styleWhenHovering()
    });
    this.olHover.setProperties({ component: this }, true);
    // 👉 for selecting
    this.olSelect = new OLSelect({
      addCondition: (event): boolean =>
        this.multi() ? click(event) && shiftKeyOnly(event) : never(),
      condition: (event): boolean => click(event),
      layers: whichLayers,
      multi: this.multi(),
      removeCondition: (event): boolean =>
        this.multi() ? click(event) && platformModifierKeyOnly(event) : never(),
      style: this.#styleWhenSelected(),
      toggleCondition: (): boolean => never()
    });
    this.olSelect.setProperties({ component: this }, true);
  }

  // 👉 selection is read-only if any feature is drawn from any layer
  //    which is not the primary layer
  get roSelection(): boolean {
    return this.selected.some(
      (feature) => this.olSelect.getLayer(feature) !== this.layer.olLayer
    );
  }

  get selected(): OLFeature<any>[] {
    return this.olSelect.getFeatures().getArray();
  }

  get selectedIDs(): any[] {
    return this.selected.map((feature) => feature.getId());
  }

  // 🔥 this is a HACK!
  //    we pretend we can select parcels, but instead we just zoom
  //    the idea is to make ol-control-searchparcels.ts work

  @Debounce(250) selectParcels(parcels: Parcel[]): void {
    // 👇 assume these parcels are degenerate and that all we have
    //    available is ID and bbox
    const bbox = parcels.reduce(
      (bbox, parcel) => extend(bbox, parcel.bbox),
      [...parcels[0].bbox]
    );
    // 👉 that's the union of the extent
    const extent = transformExtent(
      bbox,
      this.#map.featureProjection,
      this.#map.projection
    );
    // 👇 zoom to the extent of all the selected parcels and select them
    const minZoom = this.#map.olView.getMinZoom();
    this.#map.olView.setMinZoom(this.#map.minUsefulZoom());
    this.#map.olView.fit(extent, {
      callback: () => {
        this.#map.olView.setMinZoom(minZoom);
      },
      duration: this.zoomAnimationDuration(),
      maxZoom: this.maxZoom() ?? this.#map.maxZoom(),
      size: this.#map.olMap.getSize()
    });
  }

  addToMap(): void {
    this.#map.olMap.addInteraction(this.olHover);
    this.#map.olMap.addInteraction(this.olSelect);
  }

  ngOnDestroy(): void {
    if (this.#selectKey) unByKey(this.#selectKey);
  }

  ngOnInit(): void {
    this.#selectKey = this.olSelect.on("select", this.#onSelect.bind(this));
  }

  reselectLandmarks(ids: LandmarkID[]): void {
    this.selectLandmarks(ids);
  }

  selectLandmarks(ids: LandmarkID[]): void {
    const delta = this.#hasSelectionChanged(ids);
    this.olSelect.getFeatures().clear();
    const layers = this.layers() ?? [this.layer];
    layers.forEach((layer) => {
      layer.olLayer.getSource().forEachFeature((feature) => {
        if (ids.includes(feature.getId()))
          this.olSelect.getFeatures().push(feature);
      });
    });
    // 👉 only push an event if the selection has changed
    //    OL will reselect when features come in and out of view,
    //    so we need to jump through all the other hoops
    if (delta) this.#onSelect();
  }

  unselectLandmarks(): void {
    this.selectLandmarks([]);
  }

  #hasSelectionChanged(ids: LandmarkID[]): boolean {
    const diff = new Set(this.selectedIDs);
    if (ids.length !== diff.size) return true;
    for (const id of ids) diff.delete(id);
    return diff.size > 0;
  }

  #onSelect(_event?: OLSelectEvent): void {
    const names = this.selected.map((selected) => selected.getId()).join(", ");
    console.log(`%cSelected landmarks`, "color: lightcoral", `[${names}]`);
    this.featuresSelected.emit(this.selected);
  }

  #styleWhenHovering(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      const layer: OLLayerVectorComponent = this.olHover
        .getLayer(feature)
        .get("component");
      return layer?.styleWhenHovering?.()(feature, resolution) as OLStyle[];
    };
  }

  #styleWhenSelected(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      const layer: OLLayerVectorComponent = this.olSelect
        .getLayer(feature)
        .get("component");
      return layer?.styleWhenSelected?.()(feature, resolution) as OLStyle[];
    };
  }
}
