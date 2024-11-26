import { Landmark } from "../common";
import { DestroyService } from "../services/destroy";
import { OLInteractionSelectLandmarksComponent } from "./ol-interaction-selectlandmarks";
import { OLMapComponent } from "./ol-map";
import { OLPopupSelectionComponent } from "./ol-popup-selection";

import { ChangeDetectionStrategy } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { Component } from "@angular/core";
import { ElementRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

import { inject } from "@angular/core";
import { viewChild } from "@angular/core";
import { outputToObservable } from "@angular/core/rxjs-interop";
import { area } from "@turf/area";
import { convertArea } from "@turf/helpers";
import { convertLength } from "@turf/helpers";
import { length } from "@turf/length";
import { map } from "rxjs/operators";
import { takeUntil } from "rxjs/operators";

import OLFeature from "ol/Feature";
import OLGeoJSON from "ol/format/GeoJSON";

interface Coordinate {
  elevation: number;
  latitude: number;
  longitude: number;
}

// 👇 we can't use the normal DestroyService protocol here
//    as snackbar popups don't have a standard lifecycle
//    when created via openFromTemplate

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-popup-landmarkproperties",
  template: `
    <button 
      (click)="onClose()" 
      [appAutoFocus]="focussed"
      class="closer" 
      mat-icon-button
      title="Close popup">
      <fa-icon [icon]="['fas', 'times']" size="lg"></fa-icon>
    </button>

    @if (canClipboard()) {
      <button 
        (click)="onClipboard()" 
        class="clipboard" 
        mat-icon-button
        title="Copy to clipboard">
        <fa-icon [icon]="['far', 'clipboard']" size="lg"></fa-icon>
      </button>
    }
    @if (landmark) {
      <table class="properties">
        @if (landmark.properties.name) {
          <tr>
            <td colspan="2">{{ landmark.properties.name }}</td>
          </tr>
        }
        @switch (landmark.geometry.type) {
          @case ('LineString') {
            <tr>
              <td>Length</td>
              <td>{{ length() | number: '1.0-0' }}'</td>
            </tr>
          }
          @case ('Point') {
            @if (toCoordinate(landmark.geometry.coordinates); as coordinate) {
              <tr>
                <td>Latitude</td>
                <td>{{ coordinate.latitude | number: '1.0-6' }}</td>
              </tr>
              <tr>
                <td>Longitude</td>
                <td>{{ coordinate.longitude | number: '1.0-6' }}</td>
              </tr>
              @if (landmark.geometry.coordinates[2]) {
                <tr>
                  <td>Elevation</td>
                  <td>{{ coordinate.elevation | number: '1.0-0' }}'</td>
                </tr>
              }
            }
          }
          @case ('Polygon') {
            <tr>
              <td>Area</td>
              <td>{{ area() | number: '1.0-2' }} acres</td>
            </tr>
            <tr>
              <td>Perimeter</td>
              <td>{{ length() | number: '1.0-0' }}'</td>
            </tr>
          }
        }
        @if (landmark.properties.metadata; as metadata) {
          @for (item of metadata | keyvalue; track item) {
            <tr>
              <td>{{ item.key }}</td>
              <td>{{ item.value }}</td>
            </tr>
          }
        }
      </table>
    }
  `,
  standalone: false
})
export class OLPopupLandmarkPropertiesComponent {
  focussed = false;
  landmark: Landmark;
  table = viewChild<ElementRef>("table");

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #format: OLGeoJSON;
  #map = inject(OLMapComponent);
  #popper = inject(OLPopupSelectionComponent);
  #snackBar = inject(MatSnackBar);

  constructor() {
    this.#format = new OLGeoJSON({
      dataProjection: this.#map.featureProjection,
      featureProjection: this.#map.projection
    });
    // 👉 see above, no ngOnInit where we'd normally do this
    this.#handleEscape$();
    this.#handleFeatureSelected$();
  }

  area(): number {
    return convertArea(area(this.landmark), "meters", "acres");
  }

  canClipboard(): boolean {
    return this.#popper.canClipboard();
  }

  length(): number {
    return length(this.landmark, { units: "feet" });
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

  toCoordinate(raw: any[]): Coordinate {
    return {
      elevation: raw[2]
        ? convertLength(Number(raw[2]), "meters", "feet")
        : null,
      latitude: raw[1],
      longitude: raw[0]
    };
  }

  #handleEscape$(): void {
    this.#map.escape$.pipe(takeUntil(this.#destroy$)).subscribe(() => {
      this.onClose();
    });
  }

  // 👇 note only single selection is supported
  //    and we could be selecting a bridge, stream crossing etc etc

  #handleFeatureSelected$(): void {
    outputToObservable(this.#map.featuresSelected)
      .pipe(
        map(
          (features: OLFeature<any>[]): Landmark =>
            features.length > 0
              ? JSON.parse(this.#format.writeFeature(features[0]))
              : null
        )
      )
      .subscribe((landmark: Landmark) => {
        this.landmark = landmark;
        if (!this.landmark) this.onClose();
        else {
          this.focussed = false;
          this.#cdf.markForCheck();
          setTimeout(() => (this.focussed = true), 0);
        }
      });
  }
}
