import { ConfirmDialogComponent } from '../../components/confirm-dialog';
import { ConfirmDialogData } from '../../components/confirm-dialog';
import { DestroyService } from '../../services/destroy';
import { OLInteractionDrawComponent } from '../ol-interaction-draw';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-interaction-drawlandmark',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionDrawLandmarkComponent extends OLInteractionDrawComponent {
  constructor(
    private dialog: MatDialog,
    protected destroy$: DestroyService,
    protected layer: OLLayerVectorComponent,
    protected map: OLMapComponent,
    private store: Store
  ) {
    super(destroy$, layer, map);
  }

  saveFeature(): void {
    const data: ConfirmDialogData = {
      content: `Do you want to save the new landmark?`,
      title: 'Please confirm new landmark'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          console.log({ feature: this.getFeature() });
        }
      });
  }
}
