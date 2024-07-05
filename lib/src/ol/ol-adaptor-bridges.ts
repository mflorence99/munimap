import { BridgeProperties } from "../common";
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
      useExisting: forwardRef(() => OLAdaptorBridgesComponent),
    },
  ],
  selector: "app-ol-adaptor-bridges",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
})
export class OLAdaptorBridgesComponent implements Adaptor {
  bridgeWidth = input(48);

  // 👇 construct LandmarkProperties
  adapt(bridge: BridgeProperties): LandmarkProperties[] {
    const condition = bridge.RYGB?.toLowerCase() || "blue";
    return [
      new LandmarkPropertiesClass({
        fontColor: "--map-bridge-line-color",
        fontFeet: this.bridgeWidth(),
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: "bold",
        iconColor: `--map-bridge-${condition}-icon-color`,
        iconOutline: true,
        iconOutlineColor: "--map-bridge-line-color",
        iconOpacity: 1,
        iconSymbol: "\ue4c8" /* 👈 bridge */,
        textAlign: "center",
        textBaseline: "bottom",
        // 👉 a bridge is often co-located with a stream crossing
        textOffsetFeet: [-this.bridgeWidth(), this.bridgeWidth()],
      }),
    ];
  }

  // 👇 tweak style when hovering
  adaptWhenHovering(bridge: BridgeProperties): LandmarkProperties[] {
    const hovering = this.adapt(bridge)[0];
    hovering.fontColor = "--map-landmark-hover";
    hovering.iconColor = "--map-landmark-hover";
    return [hovering];
  }

  // 👇 tweak style when selected
  adaptWhenSelected(bridge: BridgeProperties): LandmarkProperties[] {
    const selected = this.adapt(bridge)[0];
    selected.fontColor = "--map-landmark-select";
    selected.iconColor = "--map-landmark-select";
    return [selected];
  }
}
