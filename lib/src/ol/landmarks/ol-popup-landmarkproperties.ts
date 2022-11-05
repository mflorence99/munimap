import { Landmark } from '../../common';
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

import { convertArea } from '@turf/helpers';
import { convertLength } from '@turf/helpers';
import { map } from 'rxjs/operators';

import area from '@turf/area';
import length from '@turf/length';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';

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
  selector: 'app-ol-popup-landmarkproperties',
  templateUrl: './ol-popup-landmarkproperties.html',
  styleUrls: [
    '../ol-popup-selection.scss',
    './ol-popup-landmarkproperties.scss'
  ]
})
export class OLPopupLandmarkPropertiesComponent {
  #format: OLGeoJSON;
  #subToSelection: Subscription;

  landmark: Landmark;

  @ViewChild('table', { static: true }) table: ElementRef;

  constructor(
    private cdf: ChangeDetectorRef,
    private popper: OLPopupSelectionComponent,
    private map: OLMapComponent,
    private snackBar: MatSnackBar
  ) {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
    // 👉 see above, no ngOnInit where we'd normally do this
    this.#handleFeatureSelected$();
  }

  // 👇 note only single selection is supported
  //    and we could be selecting a bridge, stream crossing etc etc

  #handleFeatureSelected$(): void {
    /* 🔥 this.#subToSelection = */ this.map.featuresSelected
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
        else this.cdf.markForCheck();
      });
  }

  area(): number {
    return convertArea(area(this.landmark), 'meters', 'acres');
  }

  canClipboard(): boolean {
    return this.popper.canClipboard();
  }

  length(): number {
    return convertLength(
      length(this.landmark, { units: 'miles' }),
      'miles',
      'feet'
    );
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

  toCoordinate(raw: any[]): Coordinate {
    return {
      elevation: raw[2]
        ? convertLength(Number(raw[2]), 'meters', 'feet')
        : null,
      latitude: raw[1],
      longitude: raw[0]
    };
  }
}
