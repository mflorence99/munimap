import { OLInteractionSelectLandmarksComponent } from '../landmarks/ol-interaction-selectlandmarks';
import { OLMapComponent } from '../ol-map';
import { UtilsService } from '../../services/utils';

import * as Sentry from '@sentry/angular';

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
  styleUrls: ['./ol-popup-dpwproperties.scss']
})
export class OLPopupDPWPropertiesComponent {
  #subToSelection: Subscription;

  properties: any /* 👈 could be bridge, stream crossing etc etc */;

  @ViewChild('table', { static: true }) table: ElementRef;

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
  //    and we could be selecting a bridge, stream crossing etc etc

  #handleFeatureSelected$(): void {
    /* 🔥 this.#subToSelection = */ this.map.featuresSelected
      .pipe(
        map((features: OLFeature<any>[]): any => {
          // 🔥 feature may be landmark with meradata representing
          //    bridge, flood hazard or stream crossing
          let properties = features[0]?.getProperties();
          if (properties?.metadata) properties = properties.metadata;
          return properties;
        })
      )
      .subscribe((properties: any) => {
        this.properties = properties;
        if (!this.properties) this.onClose();
        else {
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
        [type]: new Blob([this.table.nativeElement.innerHTML], {
          type
        }) as any
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
    // 👉 the selector MAY not be present and may not be for landmarks
    const selector = this.map.selector as OLInteractionSelectLandmarksComponent;
    selector?.unselectLandmarks?.();
    // 🔥  this doesn't seem to work
    // this.#subToSelection?.unsubscribe();
  }
}
