import { OLLayerTileComponent } from "./ol-layer-tile";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";

import { inject } from "@angular/core";
import { input } from "@angular/core";

import OLOSM from "ol/source/OSM";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-source-osm",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
})
export class OLSourceOSMComponent implements OnInit {
  maxZoom = input<number>();
  olOSM: OLOSM;

  #layer = inject(OLLayerTileComponent);

  ngOnInit(): void {
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    this.olOSM = new OLOSM({ maxZoom: this.maxZoom() });
    this.olOSM.setProperties({ component: this }, true);
    this.#layer.olLayer.setSource(this.olOSM);
  }
}
