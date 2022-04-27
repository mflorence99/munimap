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

  saveFeatures(features: GeoJSON.Feature<any>[]): Observable<boolean> {
    const data: ConfirmDialogData = {
      content: `Blah blah?`,
      title: 'Blah Blah'
    };
    return this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        tap((result) => {
          if (result) {
            features.forEach((feature, ix) => {
              const landmark: Partial<Landmark> = {
                geometry: feature.geometry,
                owner: this.authState.currentProfile().email,
                path: this.map.path,
                type: 'Feature'
              };
              let properties;
              switch (feature.geometry.type) {
                case 'Point':
                  properties = new LandmarkPropertiesClass({
                    fontColor: '--map-place-text-color',
                    fontOpacity: 1,
                    fontOutline: true,
                    fontSize: 'large',
                    fontStyle: 'italic'
                  });
                  break;
                case 'LineString':
                  properties = new LandmarkPropertiesClass({
                    fontColor: '--map-trail-text-color',
                    fontOpacity: 1,
                    fontOutline: true,
                    fontSize: 'medium',
                    fontStyle: 'italic',
                    lineChunk: true,
                    lineDash: [2, 1],
                    lineSpline: true,
                    showDimension: true,
                    strokeColor: '--map-trail-line-color',
                    strokeOpacity: 1,
                    strokeStyle: 'dashed',
                    strokeWidth: 'medium'
                  });
                  break;
                case 'Polygon':
                  properties = new LandmarkPropertiesClass({
                    fillColor: '--map-parcel-fill-u190',
                    fillOpacity: 0.15,
                    fontColor: '--map-conservation-outline',
                    fontOpacity: 1,
                    fontSize: 'small',
                    fontStyle: 'normal',
                    showDimension: true,
                    strokeColor: '--map-parcel-fill-u190',
                    strokeOpacity: 1,
                    strokeStyle: 'solid',
                    strokeWidth: 'medium'
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
