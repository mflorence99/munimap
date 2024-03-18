import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';
import { UtilsService } from '../services/utils';

import * as Sentry from '@sentry/angular-ivy';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { OnInit } from '@angular/core';
import { TemplateRef } from '@angular/core';

import { inject } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { viewChild } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-popup-selection',
  template: '<ng-template #popup><ng-content></ng-content></ng-template>',
  styles: [':host { display: none }']
})
export class OLPopupSelectionComponent implements OnInit {
  popup = viewChild<TemplateRef<any>>('popup');
  snackBarRef: MatSnackBarRef<any>;

  #destroy$ = inject(DestroyService);
  #map = inject(OLMapComponent);
  #snackBar = inject(MatSnackBar);
  #utils = inject(UtilsService);

  // 🔥 copy to clipboard does not seems to work under iOS
  canClipboard(): boolean {
    return typeof ClipboardItem !== 'undefined' && !this.#utils.iOS();
  }

  ngOnInit(): void {
    this.#handleFeaturesSelected$();
  }

  toClipboard(element: ElementRef): void {
    const type = 'text/html';
    // 👉 get type mismatch error w/o any, contradicting the MDN example
    //    https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem
    const data = [
      new ClipboardItem({
        [type]: new Blob([element.nativeElement.innerHTML], {
          type
        }) as any
      })
    ];
    navigator.clipboard
      .write(data)
      .then(() =>
        console.log('%cElement copied to clipboard', 'color: skyblue')
      )
      .catch(() => {
        console.error('🔥 Copy to clipboard failed');
        Sentry.captureMessage('Copy to clipboard failed');
      });
  }

  #handleFeaturesSelected$(): void {
    this.#map.featuresSelected
      .pipe(takeUntil(this.#destroy$))
      .subscribe((features) => {
        // 👇 the idea here is to keep the popup open until it is
        //    manually dismissed, so that it can respond without
        //    jank as new features are selected
        if (features.length === 0) this.#snackBar.dismiss();
        else if (!this.snackBarRef || this.snackBarRef.instance.destroyed) {
          this.snackBarRef = this.#snackBar.openFromTemplate(this.popup());
        }
      });
  }
}
