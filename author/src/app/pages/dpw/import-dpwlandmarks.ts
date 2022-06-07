import { ImportLandmarksComponent } from '../property/import-landmarks';

import { AddLandmark } from '@lib/state/landmarks';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Landmark } from '@lib/common';
import { Store } from '@ngxs/store';
import { StreamCrossingProperties } from '@lib/common';

import { firstValueFrom } from 'rxjs';
import { makeLandmarkID } from '@lib/common';

import hash from 'object-hash';

// 🔥 this is a stripped down version of the more generalized
//    implementation in property/import-landmarks.ts and is designed
//    to ONLY import DPW landmarks like stream crossings, etc.

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-import-dpwlandmarks',
  styleUrls: [
    '../property/import-landmarks.scss',
    '../../../../../lib/css/sidebar.scss'
  ],
  templateUrl: '../property/import-landmarks.html'
})
export class ImportDPWLandmarksComponent extends ImportLandmarksComponent {
  constructor(
    protected authState: AuthState,
    protected cdf: ChangeDetectorRef,
    protected firestore: Firestore,
    protected store: Store
  ) {
    super(authState, cdf, firestore, store);
  }

  // 🔥 only "Point" features are supported and they are assumed to be
  //    stream crossings

  async makeLandmarks(
    geojsons: GeoJSON.FeatureCollection<any>[]
  ): Promise<void> {
    for (const geojson of geojsons) {
      if (this.cancelling) break;
      for (const feature of geojson.features) {
        if (this.cancelling) break;
        this.numImported += 1;
        this.cdf.markForCheck();
        // 👇 potentially one landmark per feature
        const importHash = hash.MD5(feature);
        const alreadyImported = await this.alreadyImported(importHash);
        if (!alreadyImported) {
          const landmark: Partial<Landmark> = {
            geometry: feature.geometry,
            owner: this.authState.currentProfile().email,
            path: this.map.path,
            type: 'Feature'
          };
          let properties;
          // 🔥 TODO - parse name & desc for properties
          switch (feature.geometry?.type) {
            case 'Point':
              properties = {
                metadata: {
                  StructCond: 'unknown',
                  name: feature.properties.name,
                  type: 'stream crossing'
                } as Partial<StreamCrossingProperties>
              };
              break;
          }
          // 👇 add the landmark if it fits our profile
          if (properties) {
            landmark.id = makeLandmarkID(landmark);
            landmark.importHash = importHash;
            landmark.properties = properties;
            await firstValueFrom(
              this.store.dispatch(new AddLandmark(landmark))
            );
          }
        }
      }
    }
  }
}
