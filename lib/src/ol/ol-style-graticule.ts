import { OLControlGraticuleComponent } from "./ol-control-graticule";
import { OLMapComponent } from "./ol-map";
import { Styler } from "./ol-styler";
import { StylerComponent } from "./ol-styler";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";

import OLFill from "ol/style/Fill";
import OLStroke from "ol/style/Stroke";
import OLStyle from "ol/style/Style";
import OLText from "ol/style/Text";

// 👇 styles ol-ext/control/graticule

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleGraticuleComponent)
    }
  ],
  selector: "app-ol-style-graticule",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"],
  standalone: false
})
export class OLStyleGraticuleComponent implements Styler {
  fontFamily = input("Roboto");
  fontSize = input(10);
  fontWeight = input<"bold" | "normal">("normal");
  lineDash = input([2, 2]);
  lineWidth = input(0.25);
  printing = input<boolean>();

  // eslint-disable-next-line no-unused-private-class-members
  #graticule = inject(OLControlGraticuleComponent) /* 👈 enforce container */;
  #map = inject(OLMapComponent);

  style(): OLStyle {
    return new OLStyle({
      fill: this.#border(),
      stroke: this.#line(),
      text: this.#coords()
    });
  }

  #border(): OLFill {
    // 👉 this is the part of the border that isn't the same
    //    color as the lines
    const color = this.#map.vars["--map-graticule-border-color"];
    return new OLFill({ color: `rgba(${color}, 1)` });
  }

  #coords(): OLText {
    const color = this.#map.vars["--map-graticule-text-color"];
    const outline = this.#map.vars["--map-graticule-text-inverse"];
    let fontSize = this.fontSize();
    // 👇 when we are printing, we want the lat/lon to be visible
    if (this.printing()) {
      const element = this.#map.olMap.getTargetElement();
      fontSize = element.clientHeight / 250;
    }
    return new OLText({
      font: `${this.fontWeight()} ${fontSize}px '${this.fontFamily()}'`,
      fill: new OLFill({ color: `rgba(${color}, 1)` }),
      stroke: new OLStroke({
        color: `rgba(${outline}, 3)`,
        width: 1
      })
    });
  }

  #line(): OLStroke {
    const color = this.#map.vars["--map-graticule-line-color"];
    return new OLStroke({
      color: `rgba(${color},  1)`,
      lineCap: "square",
      lineDash: this.lineDash(),
      width: this.lineWidth()
    });
  }
}
