import { OLInteractionSelectLandmarksComponent } from './ol-interaction-selectlandmarks';
import { OLMapComponent } from './ol-map';
import { OLPopupSelectionComponent } from './ol-popup-selection';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { viewChild } from '@angular/core';

import OLFeature from 'ol/Feature';

export type Schema = Array<
  [string, string, string?, ((properties: any) => string)?]
>;

// 👇 we can't use the normal DestroyService protocol here
//    as snackbar popups don't have a standard lifecycle
//    when created via openFromTemplate

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-dpwproperties',
  template: `
    <button (click)="onClose()" class="closer" mat-icon-button>
      <fa-icon [icon]="['fas', 'times']" size="lg"></fa-icon>
    </button>

    @if (canClipboard()) {
      <button (click)="onClipboard()" class="clipboard" mat-icon-button>
        <fa-icon [icon]="['far', 'clipboard']" size="lg"></fa-icon>
      </button>
    }

    <!-- 
      🔥 see Bridge... Culvert... FloodHazard... and StreamCrossingProperties 
        the original DES properties are untouched and these are 
        discriminated by a common type property
    -->

    <section #table class="wrapper">
      @switch (properties?.type) {
        @case ('bridge') {
          <app-ol-popup-bridgeproperties
            [properties]="properties"></app-ol-popup-bridgeproperties>
        }
        @case ('culvert') {
          <app-ol-popup-culvertproperties
            [properties]="properties"></app-ol-popup-culvertproperties>
        }
        @case ('flood hazard') {
          <app-ol-popup-floodhazardproperties
            [properties]="properties"></app-ol-popup-floodhazardproperties>
        }
        @case ('stream crossing') {
          <app-ol-popup-streamcrossingproperties
            [properties]="properties"></app-ol-popup-streamcrossingproperties>
        }
      }
    </section>
  `,
  styleUrls: ['./ol-popup-abstractproperties.scss']
})
export class OLPopupDPWPropertiesComponent {
  geometry: any /* 👈 in practice will be a Point */;
  properties: any /* 👈 could be bridge, stream crossing etc etc */;
  table = viewChild<ElementRef>('table');

  #cdf = inject(ChangeDetectorRef);
  #map = inject(OLMapComponent);
  #popper = inject(OLPopupSelectionComponent);
  #snackBar = inject(MatSnackBar);

  constructor() {
    // 👉 see above, no ngOnInit where we'd normally do this
    this.#handleFeatureSelected$();
  }

  // 👇 note only single selection is supported
  //    and we could be selecting a bridge, stream crossing etc etc

  canClipboard(): boolean {
    return this.#popper.canClipboard();
  }

  // 👉 https://developers.google.com/maps/documentation/urls/get-started
  googleLink(): string {
    const marker = this.geometry
      .clone()
      .transform(this.#map.projection, this.#map.featureProjection)
      .getCoordinates();
    const link = `https://www.google.com/maps/search/?api=1&query=${
      marker[1]
    }%2C${marker[0]}&zoom=${Math.round(
      this.#map.olView.getZoom()
    )}&basemap=terrain`;
    return link;
  }

  onClipboard(): void {
    this.#popper.toClipboard(this.table());
  }

  onClose(): void {
    this.#snackBar.dismiss();
    // 👉 the selector MAY not be present and may not be for landmarks
    const selector =
      this.#map.selector() as OLInteractionSelectLandmarksComponent;
    selector?.unselectLandmarks?.();
  }

  #handleFeatureSelected$(): void {
    outputToObservable(this.#map.featuresSelected)
      .pipe(
        map((features: OLFeature<any>[]): [any, any] => {
          // 🔥 feature may be landmark with metadata representing
          //    bridge, flood hazard or stream crossing
          let properties = features[0]?.getProperties();
          const geometry = features[0]?.getGeometry();
          if (properties?.metadata) properties = properties.metadata;
          return [properties, geometry];
        })
      )
      .subscribe(([properties, geometry]) => {
        this.properties = properties;
        this.geometry = geometry;
        if (!this.properties) this.onClose();
        else this.#cdf.markForCheck();
      });
  }
}
