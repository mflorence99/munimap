import { LandmarkProperties } from "../common";
import { LandmarkPropertiesClass } from "../common";
import { ParcelProperties } from "../common";
import { Adaptor } from "./ol-adaptor";
import { AdaptorComponent } from "./ol-adaptor";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { forwardRef } from "@angular/core";
import { input } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorConservationsComponent),
    },
  ],
  selector: "app-ol-adaptor-conservations",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
})
export class OLAdaptorConservationsComponent implements Adaptor {
  borderOpacity = input(1);
  borderPixels = input(1);
  fillOpacity = input(0.25);

  // 👇 construct LandmarkProperties
  adapt(conservation: ParcelProperties): LandmarkProperties[] {
    if (
      conservation.usage &&
      ["500", "501", "502"].includes(conservation.usage)
    ) {
      return [
        new LandmarkPropertiesClass({
          fillColor: `--map-parcel-fill-u${conservation.usage}`,
          fillOpacity: this.fillOpacity(),
          strokeColor: "--map-conservation-outline",
          strokeOpacity: this.borderOpacity(),
          strokePixels: this.borderPixels(),
          strokeStyle: "dashed",
        }),
      ];
    } else return [];
  }
}
