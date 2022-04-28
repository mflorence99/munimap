import { Landmark } from '../../common';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';
import { UpdateLandmark } from '../../state/landmarks';

import { calculateOrientation } from '../../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Store } from '@ngxs/store';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import transformRotate from '@turf/transform-rotate';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-interaction-convert2building',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionConvertToBuildingComponent {
  #format: OLGeoJSON;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private store: Store
  ) {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
  }

  convert(feature: OLFeature<any>): void {
    const geojson = JSON.parse(this.#format.writeFeature(feature));
    // 👇 calculate the orientation of the building outline
    const theta = calculateOrientation(geojson);
    // 👇 rotate it level, expand to bbox, then rotate it back
    let munged = transformRotate(geojson, theta * -1);
    munged = bboxPolygon(bbox(munged));
    munged = transformRotate(munged, theta);
    // 👉 update the store
    const landmark: Partial<Landmark> = {
      id: feature.getId() as string,
      geometry: munged.geometry,
      properties: {
        fillColor: '--map-building-fill',
        fillOpacity: 1,
        fontColor: '--map-building-outline',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'medium',
        fontStyle: 'italic',
        shadowColor: '--map-building-outline',
        shadowOffsetFeet: [6, -6],
        shadowOpacity: 0.75,
        showDimension: false,
        strokeColor: '--map-building-outline',
        strokeOpacity: 1,
        strokePixels: 1,
        strokeStyle: 'solid'
      },
      type: 'Feature'
    };
    this.store.dispatch(new UpdateLandmark(landmark));
  }

  // saveRedraw(feature: GeoJSON.Feature<any>): Observable<boolean> {
  //   const data: ConfirmDialogData = {
  //     content: `Do you want to save the new landmark alignment for ${this.feature.get(
  //       'name'
  //     )}?`,
  //     title: 'Please confirm new alignment'
  //   };
  //   return this.dialog
  //     .open(ConfirmDialogComponent, { data })
  //     .afterClosed()
  //     .pipe(
  //       tap((result) => {
  //         if (result) {
  //           // 👉 update the store
  //           const landmark: Partial<Landmark> = {
  //             id: this.feature.getId() as string,
  //             geometry: feature.geometry,
  //             type: 'Feature'
  //           };
  //           this.store.dispatch(new UpdateLandmark(landmark));
  //         }
  //         // 👉 on CANCEL, reset geometry
  //         else this.resetRedraw();
  //       })
  //     );
  // }
}
