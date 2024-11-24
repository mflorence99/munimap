import { LandmarkProperties } from "../common";
import { LandmarkPropertiesClass } from "../common";
import { StreamCrossingProperties } from "../common";
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
            useExisting: forwardRef(() => OLAdaptorStreamCrossingsComponent)
        }
    ],
    selector: "app-ol-adaptor-streamcrossings",
    template: "<ng-content></ng-content>",
    styles: [":host { display: none }"],
    standalone: false
})
export class OLAdaptorStreamCrossingsComponent implements Adaptor {
  streamCrossingWidth = input(36);
  // 👇 construct LandmarkProperties
  adapt(streamCrossing: StreamCrossingProperties): LandmarkProperties[] {
    const condition = streamCrossing.StructCond?.toLowerCase() || "unknown";
    return [
      new LandmarkPropertiesClass({
        fontColor: "--map-streamcrossing-line-color",
        fontFeet: this.streamCrossingWidth(),
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: "bold",
        iconColor: `--map-streamcrossing-${condition}-icon-color`,
        iconOpacity: 1,
        iconOutline: true,
        iconOutlineColor: "--map-streamcrossing-line-color",
        iconSymbol: "\ue4ce" /* 👈 bridge-water */,
        textAlign: "center",
        textBaseline: "bottom"
      })
    ];
  }

  // 👇 tweak style when hovering
  adaptWhenHovering(
    streamCrossing: StreamCrossingProperties
  ): LandmarkProperties[] {
    const hovering = this.adapt(streamCrossing)[0];
    hovering.fontColor = "--map-landmark-hover";
    hovering.iconColor = "--map-landmark-hover";
    return [hovering];
  }

  // 👇 tweak style when selected
  adaptWhenSelected(
    streamCrossing: StreamCrossingProperties
  ): LandmarkProperties[] {
    const selected = this.adapt(streamCrossing)[0];
    selected.fontColor = "--map-landmark-select";
    selected.iconColor = "--map-landmark-select";
    return [selected];
  }
}
