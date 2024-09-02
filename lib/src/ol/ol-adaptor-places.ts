import { LandmarkProperties } from "../common";
import { LandmarkPropertiesClass } from "../common";
import { PlaceProperties } from "../common";
import { PlacePropertiesType } from "../common";
import { Adaptor } from "./ol-adaptor";
import { AdaptorComponent } from "./ol-adaptor";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { forwardRef } from "@angular/core";

interface PlaceStyleAttributes {
  color: string;
  fontSize: "huge" | "large" | "medium" | "small" | "tiny";
  placement: "line" | "point";
}

// 👇 most places are drawn like this

const DEFAULT: PlaceStyleAttributes = {
  color: "--map-place-text-color",
  fontSize: "tiny",
  placement: "point"
};

const EXCEPTIONS: {
  [key in PlacePropertiesType]?: PlaceStyleAttributes;
} = {
  lake: {
    color: "--map-place-water-color",
    fontSize: "huge",
    placement: "point"
  },
  park: {
    color: "--map-place-text-color",
    fontSize: "huge",
    placement: "point"
  },
  stream: {
    color: "--map-place-water-color",
    fontSize: "large",
    placement: "line"
  }
};

// 👇 place types not in this list are ignored
//    place types without an icon show only text

const ICONS: {
  [key in PlacePropertiesType]?: string;
} = {
  airport: "\uf072",
  area: "\uf124",
  bar: "\uf000",
  basin: "\uf773",
  bay: "\uf773",
  beach: "\uf5ca",
  bench: "\uf6c0",
  bend: "\uf5eb",
  bridge: "\uf041",
  building: "\uf1ad",
  canal: "\uf041",
  cape: "\uf041",
  cave: "\uf041",
  cemetery: "\uf654",
  channel: "\uf041",
  church: "\uf67f",
  civil: "\uf041",
  cliff: "\uf041",
  crossing: "\uf00d",
  dam: "\uf773",
  falls: "\uf041",
  flat: "\uf041",
  forest: "\uf1bb",
  gap: "\uf041",
  gut: "\uf041",
  harbor: "\uf21a",
  hospital: "\uf47e",
  island: "\uf041",
  lake: null,
  locale: "\uf041",
  military: "\uf041",
  mine: "\uf041",
  other: "\uf041",
  park: null,
  pillar: "\uf041",
  po: "\uf674",
  range: "\uf041",
  rapids: "\uf041",
  reserve: "\uf155",
  reservoir: "\uf773",
  ridge: "\uf041",
  school: "\uf549",
  sea: "\uf773",
  slope: "\uf041",
  spring: "\uf041",
  stream: null,
  summit: "\uf6fc",
  swamp: "\uf041",
  tower: "\uf041",
  trail: "\uf041",
  valley: "\uf041",
  woods: "\uf1bb"
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorPlacesComponent)
    }
  ],
  selector: "app-ol-adaptor-places",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"]
})
export class OLAdaptorPlacesComponent implements Adaptor {
  // 👇 construct LandmarkProperties
  adapt(place: PlaceProperties): LandmarkProperties[] {
    // 🔥 HACK -- this entry appears to be noise -- it only
    //    marks the geographical center of town, which is meaningless
    if (place.name.endsWith(", Town of")) return [];
    // 👉 don't show anything we don't know about
    else if (ICONS[place.type] === undefined) return [];
    else {
      const attrs = EXCEPTIONS[place.type] || DEFAULT;
      return [
        new LandmarkPropertiesClass({
          fontColor: attrs.color,
          fontOpacity: 1,
          fontOutline: true,
          fontSize: attrs.fontSize,
          fontStyle: "bold",
          iconOpacity: 1,
          iconSymbol: ICONS[place.type],
          lineChunk: attrs.placement === "line",
          name:
            attrs.placement === "point"
              ? this.#mungeName(place.name)
              : place.name,
          textAlign: ICONS[place.type] ? "center" : null,
          textBaseline: ICONS[place.type] ? "bottom" : null
        })
      ];
    }
  }

  #mungeName(name: string): string {
    return (
      name
        // 👇 to title case
        .replace(
          /\w\S*/g,
          (str) => str.charAt(0).toUpperCase() + str.substring(1).toLowerCase()
        )
        // 👇 remove excessive punctuation
        .replace(/ - /g, " ")
        // 👇 spilt into lineDash
        .replace(/ /g, "\n")
    );
  }
}
