import { AddParcels } from '../../state/parcels';
import { AuthState } from '../../state/auth';
import { ConfirmDialogComponent } from '../../components/confirm-dialog';
import { ConfirmDialogData } from '../../components/confirm-dialog';
import { DestroyService } from '../../services/destroy';
import { OLInteractionRedrawComponent } from '../ol-interaction-redraw';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';
import { Parcel } from '../../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';

// 🔥 this is substantially the same as ol-interaction-redrawlandmark
//    refactor ??

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-interaction-redrawparcel',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionRedrawParcelComponent extends OLInteractionRedrawComponent {
  constructor(
    private authState: AuthState,
    private dialog: MatDialog,
    protected destroy$: DestroyService,
    protected layer: OLLayerVectorComponent,
    protected map: OLMapComponent,
    private store: Store
  ) {
    super(destroy$, layer, map);
  }

  saveRedraw(feature: GeoJSON.Feature<any>): void {
    const data: ConfirmDialogData = {
      content: `Do you want to save the new parcel boundary for ${this.feature.getId()}?`,
      title: 'Please confirm new boundary'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          const redrawnParcel: Parcel = {
            action: 'modified',
            geometry: feature.geometry,
            id: this.feature.getId(),
            owner: this.authState.currentProfile().email,
            path: this.map.path,
            type: 'Feature'
          };
          this.store.dispatch(new AddParcels([redrawnParcel]));
        }
        // 👉 on CANCEL, reset geometry
        else this.resetRedraw();
      });
  }
}
