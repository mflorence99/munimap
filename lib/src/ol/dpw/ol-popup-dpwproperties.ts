import { LandmarkProperties } from '../../common';
import { OLInteractionSelectLandmarksComponent } from '../landmarks/ol-interaction-selectlandmarks';
import { OLMapComponent } from '../ol-map';
import { UtilsService } from '../../services/utils';

import * as Sentry from '@sentry/angular';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { map } from 'rxjs/operators';

import OLFeature from 'ol/Feature';

// 👇 we can't use the normal DestroyService protocol here
//    as snackbar popups don't have a standard lifecycle
//    when created via openFromTemplate

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-dpwproperties',
  templateUrl: './ol-popup-dpwproperties.html',
  styleUrls: ['./ol-popup-dpwproperties.scss']
})
export class OLPopupDPWPropertiesComponent {
  #subToSelection: Subscription;

  properties: LandmarkProperties;

  constructor(
    private cdf: ChangeDetectorRef,
    private map: OLMapComponent,
    private snackBar: MatSnackBar,
    private utils: UtilsService
  ) {
    // 👉 see above, no ngOnInit where we'd normally do this
    this.#handleFeatureSelected$();
  }

  // 👇 note only single selection is supported

  #handleFeatureSelected$(): void {
    /* 🔥 this.#subToSelection = */ this.map.featuresSelected
      .pipe(
        map(
          (features: OLFeature<any>[]): LandmarkProperties =>
            features[0]?.getProperties()
        )
      )
      .subscribe((properties: LandmarkProperties) => {
        this.properties = properties;
        if (!this.properties) this.onClose();
        else {
          console.log(typeof this.properties, this.properties);
          this.cdf.markForCheck();
        }
      });
  }

  // 🔥 copy to clipboard does not seems to work under iOS
  canClipboard(): boolean {
    return typeof ClipboardItem !== 'undefined' && !this.utils.iOS();
  }

  onClipboard(): void {
    const type = 'text/html';
    // 👉 get type mismatch error w/o any, contradicting the MDN example
    //    https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem
    const data = [
      new ClipboardItem({
        [type]: new Blob(
          [
            /* :fire */
          ],
          {
            type
          }
        ) as any
      })
    ];
    navigator.clipboard
      .write(data)
      .then(() =>
        console.log('%cLandmark copied to clipboard', 'color: skyblue')
      )
      .catch(() => {
        console.error('Copy to clipboard failed');
        Sentry.captureMessage('Copy to clipboard failed');
      });
  }

  onClose(): void {
    this.snackBar.dismiss();
    // 👉 the selector MAY not be present
    const selector = this.map.selector as OLInteractionSelectLandmarksComponent;
    selector?.unselectLandmarks();
    // 🔥  this doesn't seem to work
    // this.#subToSelection?.unsubscribe();
  }
}
