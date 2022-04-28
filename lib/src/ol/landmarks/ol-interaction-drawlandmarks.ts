import { AddLandmark } from '../../state/landmarks';
import { AuthState } from '../../state/auth';
import { ConfirmDialogComponent } from '../../components/confirm-dialog';
import { ConfirmDialogData } from '../../components/confirm-dialog';
import { DestroyService } from '../../services/destroy';
import { Landmark } from '../../common';
import { LandmarkPropertiesClass } from '../../common';
import { OLInteractionDrawComponent } from '../ol-interaction-draw';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';

import { makeLandmarkID } from '../../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Store } from '@ngxs/store';

import { tap } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-interaction-drawlandmarks',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionDrawLandmarksComponent extends OLInteractionDrawComponent {
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

  saveFeatures(geojsons: GeoJSON.Feature<any>[]): Observable<boolean> {
    const data: ConfirmDialogData = {
      content: `Do you want to save these new landmarks?`,
      title: 'Please confirm new landmarks'
    };
    return this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        tap((result) => {
          if (result) {
            geojsons.forEach((geojson, ix) => {
              const landmark: Partial<Landmark> = {
                geometry: geojson.geometry,
                owner: this.authState.currentProfile().email,
                path: this.map.path,
                type: 'Feature'
              };
              let properties;
              switch (geojson.geometry.type) {
                case 'Point':
                  properties = new LandmarkPropertiesClass({
                    fontColor: '--rgb-pink-a200',
                    fontOpacity: 1,
                    fontOutline: true,
                    fontSize: 'large',
                    fontStyle: 'bold'
                  });
                  break;
                case 'LineString':
                  properties = new LandmarkPropertiesClass({
                    fontColor: '--rgb-pink-a200',
                    fontOpacity: 1,
                    fontOutline: true,
                    fontSize: 'medium',
                    fontStyle: 'italic',
                    lineChunk: true,
                    lineDash: [1, 1],
                    lineSpline: true,
                    showDimension: true,
                    strokeColor: '--rgb-purple-a200',
                    strokeOpacity: 1,
                    strokeStyle: 'dashed',
                    strokeWidth: 'medium'
                  });
                  break;
                case 'Polygon':
                  properties = new LandmarkPropertiesClass({
                    fillColor: '--rgb-pink-a200',
                    fillOpacity: 0.15,
                    fontColor: '--rgb-pink-a200',
                    fontOpacity: 1,
                    fontOutline: true,
                    fontSize: 'medium',
                    fontStyle: 'normal',
                    lineDash: [1, 1],
                    showDimension: true,
                    strokeColor: '--rgb-purple-a200',
                    strokeOpacity: 1,
                    strokeStyle: 'dashed',
                    strokeWidth: 'medium',
                    textRotate: true
                  });
                  break;
              }
              if (properties) {
                landmark.id = makeLandmarkID(landmark);
                landmark.properties = { ...properties, name: `#${ix + 1}` };
                this.store.dispatch(new AddLandmark(landmark));
              }
            });
          } else this.resetDraw();
        })
      );
  }
}
