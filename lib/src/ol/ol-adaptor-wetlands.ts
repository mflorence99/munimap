import { LandmarkProperties } from "../common";
import { LandmarkPropertiesClass } from "../common";
import { WetlandProperties } from "../common";
import { Adaptor } from "./ol-adaptor";
import { AdaptorComponent } from "./ol-adaptor";
import { OLFillPatternType } from "./ol-styler";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { forwardRef } from "@angular/core";
import { input } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorWetlandsComponent)
    }
  ],
  selector: "app-ol-adaptor-wetlands",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"]
})
export class OLAdaptorWetlandsComponent implements Adaptor {
  riverbank = input<OLFillPatternType>("rocks");
  riverbankOpacity = input(0.25);
  riverbankScale = input(2);
  swamp = input<OLFillPatternType>("swamp");
  swampOpacity = input(0.5);

  // 👇 construct LandmarkProperties
  adapt(wetland: WetlandProperties): LandmarkProperties[] {
    switch (wetland.type) {
      case "marsh":
        return [
          new LandmarkPropertiesClass({
            fillColor: "--map-wetland-swamp",
            fillOpacity: this.swampOpacity(),
            fillPattern: this.swamp()
          })
        ];
      case "water":
        return [
          new LandmarkPropertiesClass({
            fillColor: "--map-waterbody-fill",
            fillOpacity: 1
          }),
          new LandmarkPropertiesClass({
            strokeColor: "--map-riverbank-rocks",
            strokeOpacity: this.riverbankOpacity(),
            strokePattern: this.riverbank(),
            strokePatternScale: this.riverbankScale(),
            strokeStyle: "solid",
            strokeWidth: "thick"
          })
        ];
    }
  }
}
