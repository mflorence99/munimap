import { OLPopupDPWPropertiesComponent } from "./ol-popup-dpwproperties";
import { Schema } from "./ol-popup-dpwproperties";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { inject } from "@angular/core";
import { input } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-popup-culvertproperties",
  templateUrl: "./ol-popup-dpwproperties-impl.html",
  standalone: false
})
export class OLPopupCulvertPropertiesComponent {
  container = inject(OLPopupDPWPropertiesComponent);

  properties = input<any>();

  schema: Schema = [
    ["Location", "location"],
    ["Description", "description"],
    [
      "Opening",
      "dimension",
      "inches",
      (properties: any): string =>
        properties.diameter || `${properties.width}x${properties.height}`
    ],
    ["Length", "length", "feet"],
    ["Count", "count", "x"],
    ["Material", "material"],
    ["Condition", "condition"],
    ["Headwall", "headwall"],
    ["Flood Hazard", "floodHazard"],
    ["Year Re/built", "year"]
  ];
}
