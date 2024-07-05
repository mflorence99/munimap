import { LandmarkProperties } from "../common";
import { LandmarkPropertiesClass } from "../common";
import { Adaptor } from "./ol-adaptor";
import { AdaptorComponent } from "./ol-adaptor";
import { OLMapComponent } from "./ol-map";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";

import OLFontSymbol from "ol-ext/style/FontSymbol";
import OLFeature from "ol/Feature";
import OLMultiLineString from "ol/geom/MultiLineString";
import OLPoint from "ol/geom/Point";
import OLStroke from "ol/style/Stroke";
import OLStyle from "ol/style/Style";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorPowerlinesComponent),
    },
  ],
  selector: "app-ol-adaptor-powerlines",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
})
export class OLAdaptorPowerlinesComponent implements Adaptor {
  iconSize = input(15);

  #map = inject(OLMapComponent);

  // 👇 construct LandmarkProperties
  adapt(): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        strokeColor: "--map-powerline-line-color",
        strokeOpacity: 1,
        strokeStyle: "solid",
        strokeWidth: "thick",
        zIndex: 1,
      }),
    ];
  }

  // 👇 backdoor for lighning bolt icons we can't parameterize
  //    declaratively in LandmarkProperties

  backdoor(
    powerline: OLFeature<OLMultiLineString>,
    resolution: number,
  ): OLStyle[] {
    const icons: OLStyle[] = [];
    const iconColor = this.#map.vars["--map-powerline-icon-color"];
    const lineColor = this.#map.vars["--map-powerline-line-color"];
    // genius!! 👉 https://stackoverflow.com/questions/38391780
    powerline
      .getGeometry()
      .getLineStrings()
      .forEach((lineString) => {
        lineString.forEachSegment((start, end) => {
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const rotation = Math.atan2(dy, dx);
          icons.push(
            new OLStyle({
              geometry: new OLPoint(end),
              image: new OLFontSymbol({
                color: `rgba(${iconColor}, 1)`,
                font: `'Font Awesome'`,
                fontStyle: "bold",
                form: "none",
                radius: this.iconSize() / resolution,
                rotation: -rotation,
                stroke: new OLStroke({
                  color: `rgba(${lineColor}, 1)`,
                  width: 1,
                }),
                text: "\uf0e7" /* 👈 bolt */,
              }),
              zIndex: 2,
            }),
          );
        });
      });
    return icons;
  }
}
