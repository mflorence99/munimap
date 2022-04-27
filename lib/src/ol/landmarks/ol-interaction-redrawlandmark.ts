import { ConfirmDialogComponent } from '../../components/confirm-dialog';
import { ConfirmDialogData } from '../../components/confirm-dialog';
import { DestroyService } from '../../services/destroy';
import { Landmark } from '../../common';
import { OLInteractionRedrawComponent } from '../ol-interaction-redraw';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';
import { UpdateLandmark } from '../../state/landmarks';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Store } from '@ngxs/store';

import { tap } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-interaction-redrawlandmark',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionRedrawLandmarkComponent extends OLInteractionRedrawComponent {
  constructor(
    private dialog: MatDialog,
    protected destroy$: DestroyService,
    protected layer: OLLayerVectorComponent,
    protected map: OLMapComponent,
    private store: Store
  ) {
    super(destroy$, layer, map);
  }

  saveRedraw(feature: GeoJSON.Feature<any>): Observable<boolean> {
    const data: ConfirmDialogData = {
      content: `Do you want to save the new landmark alignment for ${this.feature.get(
        'name'
      )}?`,
      title: 'Please confirm new alignment'
    };
    return this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        tap((result) => {
          if (result) {
            // 👉 update the store
            const landmark: Partial<Landmark> = {
              id: this.feature.getId() as string,
              geometry: feature.geometry
            };
            this.store.dispatch(new UpdateLandmark(landmark));
          }
          // 👉 on CANCEL, reset geometry
          else this.resetRedraw();
        })
      );
  }
}
