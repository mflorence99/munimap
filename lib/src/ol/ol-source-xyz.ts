import { OLAttributionComponent } from "./ol-attribution";
import { OLLayerTileComponent } from "./ol-layer-tile";

import { environment } from "../environment";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";

import { contentChildren } from "@angular/core";
import { effect } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";

import OLXYZ from "ol/source/XYZ";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-source-xyz",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
  standalone: false
})
export class OLSourceXYZComponent implements OnInit {
  attributions = contentChildren(OLAttributionComponent);
  maxZoom = input<number>();
  olXYZ: OLXYZ;
  s = input<string[]>([]);
  url = input<string>();

  #layer = inject(OLLayerTileComponent);

  constructor() {
    effect(() => {
      this.olXYZ.setAttributions(
        this.attributions().map((attribution) => attribution.getAttribution())
      );
    });
  }

  ngOnInit(): void {
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    const parsed = new URL(this.url());
    const encoded = encodeURIComponent(this.url());
    this.olXYZ = new OLXYZ({
      crossOrigin: "anonymous",
      maxZoom: this.maxZoom(),
      url: `${environment.endpoints.proxy}/proxy/${
        parsed.hostname
      }?url=${encoded}&x={x}&y={y}&z={z}&s=${this.s().join(",")}`
    });
    this.olXYZ.setProperties({ component: this }, true);
    this.#layer.olLayer.setSource(this.olXYZ);
  }
}
