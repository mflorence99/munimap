import { LandmarkProperties } from "../common";
import { LandmarkPropertiesClass } from "../common";
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
      useExisting: forwardRef(() => OLAdaptorFloodHazardsComponent)
    }
  ],
  selector: "app-ol-adaptor-floodhazards",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"]
})
export class OLAdaptorFloodHazardsComponent implements Adaptor {
  floodHazardWidth = input(36);

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fontColor: "--map-streamcrossing-line-color",
        fontFeet: this.floodHazardWidth(),
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: "bold",
        iconColor: "--map-floodhazard-icon-color",
        iconOpacity: 1,
        iconOutline: true,
        iconOutlineColor: "--map-floodhazard-line-color",
        iconSymbol: "\uf773" /* 👈 water */,
        textAlign: "center",
        textBaseline: "bottom",
        // 👉 flood hazard can be co-located with a bridge
        //    or a stream crossing
        textOffsetFeet: [this.floodHazardWidth(), -this.floodHazardWidth()]
      })
    ];
  }

  // 👇 tweak style when hovering
  adaptWhenHovering(): LandmarkProperties[] {
    const hovering = this.adapt()[0];
    hovering.fontColor = "--map-landmark-hover";
    hovering.iconColor = "--map-landmark-hover";
    return [hovering];
  }

  // 👇 tweak style when selected
  adaptWhenSelected(): LandmarkProperties[] {
    const selected = this.adapt()[0];
    selected.fontColor = "--map-landmark-select";
    selected.iconColor = "--map-landmark-select";
    return [selected];
  }
}
