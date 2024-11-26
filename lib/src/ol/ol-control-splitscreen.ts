import { OLLayersComponent } from "./ol-layers";
import { OLMapComponent } from "./ol-map";
import { Mapable } from "./ol-mapable";
import { MapableComponent } from "./ol-mapable";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { contentChild } from "@angular/core";
import { effect } from "@angular/core";
import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";

import OLSwipe from "ol-ext/control/Swipe";

// ⚠️ this is a very simple implementation that assumes one layer
//    on the left and one on the right, and those layers never change
//    good job because that's what we need for now

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlSplitScreenComponent)
    }
  ],
  selector: "app-ol-control-splitscreen",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
  standalone: false
})
export class OLControlSplitScreenComponent implements Mapable {
  olControl: OLSwipe;
  onLeft = contentChild<OLLayersComponent>("left");
  onRight = contentChild<OLLayersComponent>("right");

  #map = inject(OLMapComponent);

  constructor() {
    this.olControl = new OLSwipe();
    this.olControl.setProperties({ component: this }, true);
    effect(() => {
      // 👇 when the layers change, add the left and right
      this.olControl.removeLayers();
      const onLeft = this.onLeft()
        .layers()
        .map((layer: any) => layer.olLayer);
      this.olControl.addLayer(onLeft, false);
      const onRight = this.onRight()
        .layers()
        .map((layer: any) => layer.olLayer);
      this.olControl.addLayer(onRight, true);
      // 👇 position the slider bar appropriately
      let position;
      if (onLeft.length > 0 && onRight.length > 0) position = 0.5;
      else if (onRight.length === 0) position = 1;
      else if (onLeft.length === 0) position = 0;
      this.olControl.set("position", position);

      // 🔥 experimental - add accessibility

      const button: any = document.querySelector(".ol-swipe button");
      if (!button.hasAttribute("title")) {
        console.log("🔥 experimental");

        button.setAttribute("title", "Swipe left or right");

        button.addEventListener("keydown", (e: any) => {
          const rect = button.getBoundingClientRect();
          const center = rect.x + rect.width / 2;
          switch (e.key) {
            case "ArrowLeft":
              this.olControl.move({ type: "mousedown", pageX: center });
              this.olControl.move({ type: "mousemove", pageX: center - 10 });
              this.olControl.move({ type: "mouseup" });
              break;
            case "ArrowRight":
              this.olControl.move({ type: "mousedown", pageX: center });
              this.olControl.move({ type: "mousemove", pageX: center + 10 });
              this.olControl.move({ type: "mouseup" });
              break;
          }
        });
      }
    });
  }

  addToMap(): void {
    this.#map.olMap.addControl(this.olControl);
  }
}
