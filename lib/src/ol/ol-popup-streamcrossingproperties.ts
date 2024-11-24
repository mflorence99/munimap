import { OLPopupDPWPropertiesComponent } from "./ol-popup-dpwproperties";
import { Schema } from "./ol-popup-dpwproperties";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { inject } from "@angular/core";
import { input } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-popup-streamcrossingproperties",
  templateUrl: "./ol-popup-dpwproperties-impl.html",
  standalone: false
})
export class OLPopupStreamCrossingPropertiesComponent {
  container = inject(OLPopupDPWPropertiesComponent);
  properties = input<any>();

  schema: Schema = [
    ["Location", "RoadNameF"],
    ["Structure Type", "StructType"],
    ["Structure Material", "StructMat"],
    ["Structure Condition", "StructCond"],
    ["Inlet Material", "UsWingwallMat"],
    ["Inlet Condition", "UsHwCon"],
    ["Outlet Material", "DsWingwallMat"],
    ["Outlet Condition", "DsHwCon"]
  ];
}
