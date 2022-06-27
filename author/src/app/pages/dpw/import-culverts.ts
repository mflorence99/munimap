import { ImportLandmarksComponent } from '../property/import-landmarks';

import { AddLandmark } from '@lib/state/landmarks';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { CulvertProperties } from '@lib/common';
import { Firestore } from '@angular/fire/firestore';
import { Landmark } from '@lib/common';
import { Store } from '@ngxs/store';

import { firstValueFrom } from 'rxjs';
import { makeLandmarkID } from '@lib/common';

import hash from 'object-hash';

// 🔥 this is a stripped down version of the more generalized
//    implementation in property/import-landmarks.ts and is designed
//    to ONLY import DPW landmarks like stream crossings, etc.

// 🔥 only "Point" features are supported and they are assumed to be  culverts

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-import-culverts',
  styleUrls: [
    '../property/import-landmarks.scss',
    '../../../../../lib/css/sidebar.scss'
  ],
  templateUrl: '../property/import-landmarks.html'
})
export class ImportCulvertsComponent extends ImportLandmarksComponent {
  constructor(
    protected authState: AuthState,
    protected cdf: ChangeDetectorRef,
    protected firestore: Firestore,
    protected store: Store
  ) {
    super(authState, cdf, firestore, store);
  }

  #makeCulvertProperties(description: string): CulvertProperties {
    const parts = description
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<br>/g, '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .trim()
      .split('\n');
    const properties: CulvertProperties = {
      condition: null,
      diameter: null,
      floodHazard: null,
      headwall: null,
      length: null,
      material: null,
      type: 'culvert',
      year: null
    };
    parts.forEach((part) => {
      if (['Poor', 'Fair', 'Good'].includes(part))
        properties.condition = part as any;
      if (/^[\d]+"$/.test(part))
        properties.diameter = Number(part.substring(0, part.length - 1));
      if (['Minor', 'Moderator', 'Major'].includes(part))
        properties.floodHazard = part as any;
      if (['Handlaid', 'Precast'].includes(part))
        properties.headwall = part as any;
      if (/^[\d]+'$/.test(part))
        properties.length = Number(part.substring(0, part.length - 1));
      if (['Concrete', 'Plastic', 'Steel'].includes(part))
        properties.material = part as any;
      if (/^\d{4}$/.test(part)) properties.year = Number(part);
    });
    return properties;
  }

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
          switch (feature.geometry?.type) {
            case 'Point':
              properties = {
                metadata: this.#makeCulvertProperties(
                  feature.properties.description /* 👈 KML */ ??
                    feature.properties.desc /* 👈 GPX */
                )
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
