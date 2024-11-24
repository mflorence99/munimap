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
            useExisting: forwardRef(() => OLAdaptorBuildingsComponent)
        }
    ],
    selector: "app-ol-adaptor-buildings",
    template: "<ng-content></ng-content>",
    styles: [":host { display: none }"],
    standalone: false
})
export class OLAdaptorBuildingsComponent implements Adaptor {
  borderOpacity = input(1);
  borderWidth = input(1);
  fillOpacity = input(1);
  shadowLength = input(6);
  shadowOpacity = input(0.75);

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        fillColor: "--map-building-fill",
        fillOpacity: this.fillOpacity(),
        shadowColor: "--map-building-outline",
        shadowOffsetFeet: [this.shadowLength(), -this.shadowLength()],
        shadowOpacity: this.shadowOpacity(),
        strokeColor: "--map-building-outline",
        strokeFeet: this.borderWidth(),
        strokeOpacity: this.borderOpacity(),
        strokeStyle: "solid"
      })
    ];
  }
}
