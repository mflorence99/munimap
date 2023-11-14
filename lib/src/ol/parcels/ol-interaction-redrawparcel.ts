import { AddParcels } from '../../state/parcels';
import { AuthState } from '../../state/auth';
import { ConfirmDialogComponent } from '../../components/confirm-dialog';
import { ConfirmDialogData } from '../../components/confirm-dialog';
import { DestroyService } from '../../services/destroy';
import { OLInteractionAbstractRedrawComponent } from '../ol-interaction-abstractredraw';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';
import { Parcel } from '../../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';

import { tap } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-interaction-redrawparcel',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionRedrawParcelComponent
  extends OLInteractionAbstractRedrawComponent
  implements OnDestroy, OnInit
{
  constructor(
    private authState: AuthState,
    private dialog: MatDialog,
    protected override destroy$: DestroyService,
    protected override layer: OLLayerVectorComponent,
    protected override map: OLMapComponent,
    private store: Store
  ) {
    super(destroy$, layer, map);
  }

  ngOnDestroy(): void {
    this.onDestroy;
  }

  ngOnInit(): void {
    this.onInit();
  }

  saveRedraw(geojson: GeoJSON.Feature<any>): Observable<boolean> {
    const data: ConfirmDialogData = {
      content: `Do you want to save the new parcel boundary for ${this.feature.getId()}?`,
      title: 'Please confirm new boundary'
    };
    return this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        tap((result) => {
          if (result) {
            const redrawnParcel: Parcel = {
              action: 'modified',
              geometry: geojson.geometry,
              id: this.feature.getId(),
              owner: this.authState.currentProfile().email,
              path: this.map.path,
              type: 'Feature'
            };
            this.store.dispatch(new AddParcels([redrawnParcel]));
          }
          // 👉 on CANCEL, reset geometry
          else this.resetRedraw();
        })
      );
  }
}
