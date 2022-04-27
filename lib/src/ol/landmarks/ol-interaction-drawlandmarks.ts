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
  selector: 'app-ol-interaction-drawlandmarks',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionDrawLandmarksComponent extends OLInteractionDrawComponent {
  constructor(
    private dialog: MatDialog,
    protected destroy$: DestroyService,
    protected layer: OLLayerVectorComponent,
    protected map: OLMapComponent,
    private store: Store
  ) {
    super(destroy$, layer, map);
  }

  saveFeatures(features: GeoJSON.Feature<any>[]): void {
    const data: ConfirmDialogData = {
      content: `Blah blah?`,
      title: 'Blah Blah'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          console.log({ features });
        }
      });
  }
}
