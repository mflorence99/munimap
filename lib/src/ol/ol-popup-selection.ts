import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { OnInit } from '@angular/core';
import { TemplateRef } from '@angular/core';
import { ViewChild } from '@angular/core';

import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-popup-selection',
  template: '<ng-template #popup><ng-content></ng-content></ng-template>',
  styles: [':host { display: none }']
})
export class OLPopupSelectionComponent implements OnInit {
  @ViewChild('popup', { read: TemplateRef, static: true })
  popup: TemplateRef<any>;

  snackBarRef: MatSnackBarRef<any>;

  constructor(
    private destroy$: DestroyService,
    private map: OLMapComponent,
    private snackBar: MatSnackBar
  ) {}

  #handleFeaturesSelected$(): void {
    this.map.selector?.featuresSelected
      .pipe(takeUntil(this.destroy$))
      .subscribe((features) => {
        // 👇 the idea here is to keep the popup open until it is
        //    manually dismissed, so that it can respond without
        //    jank as new features are selected
        if (features.length === 0) this.snackBar.dismiss();
        else if (!this.snackBarRef || this.snackBarRef.instance.destroyed) {
          this.snackBarRef = this.snackBar.openFromTemplate(this.popup);
        }
      });
  }

  ngOnInit(): void {
    this.#handleFeaturesSelected$();
  }
}
