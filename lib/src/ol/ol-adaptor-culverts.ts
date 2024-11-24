import { CulvertProperties } from "../common";
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
            useExisting: forwardRef(() => OLAdaptorCulvertsComponent)
        }
    ],
    selector: "app-ol-adaptor-culverts",
    template: "<ng-content></ng-content>",
    styles: [":host { display: none }"],
    standalone: false
})
export class OLAdaptorCulvertsComponent implements Adaptor {
  culvertWidth = input(48);

  // 👇 construct LandmarkProperties
  adapt(culvert: CulvertProperties): LandmarkProperties[] {
    const condition = culvert.condition?.toLowerCase() || "unknown";
    return [
      new LandmarkPropertiesClass({
        fontColor: "--map-culvert-line-color",
        fontFeet: this.culvertWidth(),
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: "bold",
        iconColor: `--map-culvert-${condition}-icon-color`,
        iconOutline: true,
        iconOutlineColor: "--map-culvert-line-color",
        iconOpacity: 1,
        iconSymbol: "\uf1ce" /* 👈 circle-notch */,
        name: this.#makeCulvertName(culvert),
        textAlign: "center",
        textBaseline: "bottom"
      })
    ];
  }

  // 👇 tweak style when hovering
  adaptWhenHovering(culvert: CulvertProperties): LandmarkProperties[] {
    const hovering = this.adapt(culvert)[0];
    hovering.fontColor = "--map-landmark-hover";
    hovering.iconColor = "--map-landmark-hover";
    return [hovering];
  }

  // 👇 tweak style when selected
  adaptWhenSelected(culvert: CulvertProperties): LandmarkProperties[] {
    const selected = this.adapt(culvert)[0];
    selected.fontColor = "--map-landmark-select";
    selected.iconColor = "--map-landmark-select";
    return [selected];
  }

  #makeCulvertName(culvert: CulvertProperties): string {
    const count = culvert.count > 1 ? `${culvert.count}x` : "";
    let dim = "";
    if (culvert.diameter) dim = `${culvert.diameter}"x`;
    else if (culvert.width && culvert.height)
      dim = `${culvert.width}"x${culvert.height}"x`;
    const length = `${culvert.length}'`;
    return `${count}${dim}${length}`;
  }
}
