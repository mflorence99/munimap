import { LandmarkProperties } from "../common";
import { LandmarkPropertiesClass } from "../common";
import { RailroadProperties } from "../common";
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
      useExisting: forwardRef(() => OLAdaptorRailroadsComponent)
    }
  ],
  selector: "app-ol-adaptor-railroads",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
  standalone: false
})
export class OLAdaptorRailroadsComponent implements Adaptor {
  rightOfWayWidth = input(24);
  trackWidth = input(16);

  // 👇 convert a Railroad to a Landmark
  adapt(railroad: RailroadProperties): LandmarkProperties[] {
    const color = railroad.active
      ? "--map-railroad-active-color"
      : "--map-railroad-active-color";
    return [
      new LandmarkPropertiesClass({
        lineSpline: true,
        strokeColor: color,
        strokeFeet: this.rightOfWayWidth(),
        strokeOpacity: 1,
        strokeStyle: "solid",
        zIndex: 1
      }),
      new LandmarkPropertiesClass({
        lineSpline: true,
        strokeColor: "--rgb-gray-50",
        strokeFeet: this.trackWidth(),
        strokeOpacity: 1,
        strokeStyle: "solid",
        zIndex: 2
      }),
      new LandmarkPropertiesClass({
        lineDash: [4, 4],
        lineSpline: true,
        strokeColor: color,
        strokeFeet: this.trackWidth(),
        strokeOpacity: 1,
        strokeStyle: "dashed",
        zIndex: 3
      }),
      new LandmarkPropertiesClass({
        fontColor: color,
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "medium",
        fontStyle: "italic",
        lineChunk: true,
        lineSpline: true,
        name: railroad.name,
        zIndex: 4
      })
    ];
  }
}
