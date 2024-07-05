import { OLMapComponent } from "./ol-map";
import { Mapable } from "./ol-mapable";
import { MapableComponent } from "./ol-mapable";
import { Styler } from "./ol-styler";
import { StylerComponent } from "./ol-styler";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { StyleFunction as OLStyleFunction } from "ol/style/Style";

import { contentChildren } from "@angular/core";
import { effect } from "@angular/core";
import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";

import OLVector from "ol/layer/Vector";
import OLStyle from "ol/style/Style";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLLayerVectorComponent),
    },
  ],
  selector: "app-ol-layer-vector",
  template: "<ng-content></ng-content>",
  styles: [":host { display: block; visibility: hidden }"],
})
export class OLLayerVectorComponent implements Mapable {
  id = input<string>();
  maxZoom = input(22);
  olLayer: OLVector<any>;
  opacity = input(1);
  stylers = contentChildren<Styler>(StylerComponent, { descendants: true });

  #map = inject(OLMapComponent);

  constructor() {
    this.olLayer = new OLVector({ style: this.style() });
    this.olLayer.setProperties({ component: this }, true);
    // 👇 side effects
    effect(() => this.olLayer.set("id", this.id()));
    effect(() => this.olLayer.setMaxZoom(this.maxZoom()));
    effect(() => this.olLayer.setOpacity(this.opacity()));
  }

  addToMap(): void {
    this.#map.olMap.addLayer(this.olLayer);
  }

  style(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] =>
      this.stylers()
        .map((styler: any) => styler.style()(feature, resolution))
        .flat()
        .filter((style) => !!style);
  }

  styleWhenHovering(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] =>
      this.stylers()
        .map((styler: any) => styler.styleWhenHovering?.()(feature, resolution))
        .flat()
        .filter((style) => !!style);
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] =>
      this.stylers()
        .map((styler: any) => styler.styleWhenSelected?.()(feature, resolution))
        .flat()
        .filter((style) => !!style);
  }
}
