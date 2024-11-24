import { OLMapComponent } from "./ol-map";
import { Mapable } from "./ol-mapable";
import { MapableComponent } from "./ol-mapable";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";

import OLScaleLine from "ol/control/ScaleLine";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlScaleLineComponent)
    }
  ],
  selector: "app-ol-control-scaleline",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
  standalone: false
})
export class OLControlScaleLineComponent implements Mapable {
  olControl: OLScaleLine;

  #map = inject(OLMapComponent);

  constructor() {
    this.olControl = new OLScaleLine({
      className: "ol-scaleline-line",
      units: "us"
    });
    this.olControl.setProperties({ component: this }, true);
  }

  addToMap(): void {
    this.#map.olMap.addControl(this.olControl);
  }
}
