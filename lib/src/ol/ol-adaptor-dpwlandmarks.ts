import { BridgeProperties } from "../common";
import { CulvertProperties } from "../common";
import { FloodHazardProperties } from "../common";
import { LandmarkProperties } from "../common";
import { StreamCrossingProperties } from "../common";
import { Adaptor } from "./ol-adaptor";
import { AdaptorComponent } from "./ol-adaptor";
import { OLAdaptorBridgesComponent } from "./ol-adaptor-bridges";
import { OLAdaptorCulvertsComponent } from "./ol-adaptor-culverts";
import { OLAdaptorFloodHazardsComponent } from "./ol-adaptor-floodhazards";
import { OLAdaptorLandmarksComponent } from "./ol-adaptor-landmarks";
import { OLAdaptorStreamCrossingsComponent } from "./ol-adaptor-streamcrossings";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { ViewContainerRef } from "@angular/core";

import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";

// 🔥 this special adaptor handles both standard landmarks
//    and DPW landmarks which use LandmarkProperties.metadata
//    to encapsulate BridgeProperties, CulvertProperties,
//    FloodHazardProperties and StreamCrossingProperties

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: AdaptorComponent,
            useExisting: forwardRef(() => OLAdaptorDPWLandmarksComponent)
        }
    ],
    selector: "app-ol-adaptor-dpwlandmarks",
    template: "<ng-content></ng-content>",
    styles: [":host { display: none }"],
    standalone: false
})
export class OLAdaptorDPWLandmarksComponent implements Adaptor {
  dpwLandmarkWidth = input(36);
  vcRef = inject(ViewContainerRef);

  adapt(properties: LandmarkProperties): LandmarkProperties[] {
    return this.#makeAdaptor(properties).adapt?.(
      this.#makeProperties(properties)
    );
  }

  adaptWhenHovering?(properties: LandmarkProperties): LandmarkProperties[] {
    return this.#makeAdaptor(properties).adaptWhenHovering?.(
      this.#makeProperties(properties)
    );
  }

  adaptWhenSelected?(properties: LandmarkProperties): LandmarkProperties[] {
    return this.#makeAdaptor(properties).adaptWhenSelected?.(
      this.#makeProperties(properties)
    );
  }

  #makeAdaptor(properties: LandmarkProperties): Adaptor {
    let adaptor;
    switch (properties.metadata?.type) {
      case "bridge":
        adaptor = this.vcRef.createComponent(
          OLAdaptorBridgesComponent
        ).instance;
        adaptor.bridgeWidth = this.dpwLandmarkWidth;
        break;
      case "culvert":
        adaptor = this.vcRef.createComponent(
          OLAdaptorCulvertsComponent
        ).instance;
        adaptor.culvertWidth = this.dpwLandmarkWidth;
        break;
      case "flood hazard":
        adaptor = this.vcRef.createComponent(
          OLAdaptorFloodHazardsComponent
        ).instance;
        adaptor.floodHazardWidth = this.dpwLandmarkWidth;
        break;
      case "stream crossing":
        adaptor = this.vcRef.createComponent(
          OLAdaptorStreamCrossingsComponent
        ).instance;
        adaptor.streamCrossingWidth = this.dpwLandmarkWidth;
        break;
      default:
        adaptor = new OLAdaptorLandmarksComponent();
        break;
    }
    return adaptor;
  }

  #makeProperties(
    properties: LandmarkProperties
  ):
    | BridgeProperties
    | CulvertProperties
    | FloodHazardProperties
    | LandmarkProperties
    | StreamCrossingProperties {
    return properties.metadata ?? properties;
  }
}
