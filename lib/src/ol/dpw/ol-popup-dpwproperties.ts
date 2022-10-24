import { OLInteractionSelectLandmarksComponent } from '../landmarks/ol-interaction-selectlandmarks';
import { OLMapComponent } from '../ol-map';
import { OLPopupSelectionComponent } from '../ol-popup-selection';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ViewChild } from '@angular/core';

import { map } from 'rxjs/operators';

import OLFeature from 'ol/Feature';

// 👇 we can't use the normal DestroyService protocol here
//    as snackbar popups don't have a standard lifecycle
//    when created via openFromTemplate

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-dpwproperties',
  templateUrl: './ol-popup-dpwproperties.html',
  styleUrls: ['../ol-popup-selection.scss', './ol-popup-dpwproperties.scss']
})
export class OLPopupDPWPropertiesComponent {
  #subToSelection: Subscription;

  properties: any /* 👈 could be bridge, stream crossing etc etc */;

  @ViewChild('table', { static: true }) table: ElementRef;

  constructor(
    private cdf: ChangeDetectorRef,
    private popper: OLPopupSelectionComponent,
    private map: OLMapComponent,
    private snackBar: MatSnackBar
  ) {
    // 👉 see above, no ngOnInit where we'd normally do this
    this.#handleFeatureSelected$();
  }

  // 👇 note only single selection is supported
  //    and we could be selecting a bridge, stream crossing etc etc

  #handleFeatureSelected$(): void {
    /* 🔥 this.#subToSelection = */ this.map.featuresSelected
      .pipe(
        map((features: OLFeature<any>[]): any => {
          // 🔥 feature may be landmark with metadata representing
          //    bridge, flood hazard or stream crossing
          let properties = features[0]?.getProperties();
          if (properties?.metadata) properties = properties.metadata;
          return properties;
        })
      )
      .subscribe((properties: any) => {
        this.properties = properties;
        if (!this.properties) this.onClose();
        else this.cdf.markForCheck();
      });
  }

  canClipboard(): boolean {
    return this.popper.canClipboard();
  }

  // 👉 https://developers.google.com/maps/documentation/urls/get-started
  googleLink(): string {
    const marker = this.properties.geometry
      .clone()
      .transform(this.map.projection, this.map.featureProjection)
      .getCoordinates();
    const link = `https://www.google.com/maps/search/?api=1&query=${
      marker[1]
    }%2C${marker[0]}&zoom=${Math.round(
      this.map.olView.getZoom()
    )}&basemap=terrain`;
    return link;
  }

  onClipboard(): void {
    this.popper.toClipboard(this.table);
  }

  onClose(): void {
    this.snackBar.dismiss();
    // 👉 the selector MAY not be present and may not be for landmarks
    const selector = this.map.selector as OLInteractionSelectLandmarksComponent;
    selector?.unselectLandmarks?.();
    // 🔥  this doesn't seem to work
    // this.#subToSelection?.unsubscribe();
  }
}
