import { ImportLandmarksComponent } from '../property/import-landmarks';

import { AddLandmark } from '@lib/state/landmarks';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { CulvertProperties } from '@lib/common';
import { Landmark } from '@lib/common';
import { Store } from '@ngxs/store';

import { culvertConditions } from '@lib/common';
import { culvertFloodHazards } from '@lib/common';
import { culvertHeadwalls } from '@lib/common';
import { culvertMaterials } from '@lib/common';
import { firstValueFrom } from 'rxjs';
import { inject } from '@angular/core';
import { makeLandmarkID } from '@lib/common';

import hash from 'object-hash';

// 🔥 this is a stripped down version of the more generalized
//    implementation in property/import-landmarks.ts and is designed
//    to ONLY import DPW landmarks like culverts

// 🔥 only "Point" features are supported and they are assumed to be  culverts

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-import-culverts',
  styleUrls: ['../abstract-import.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: '../abstract-import.html'
})
export class ImportCulvertsComponent extends ImportLandmarksComponent {
  #authState = inject(AuthState);
  #cdf = inject(ChangeDetectorRef);
  #store = inject(Store);

  override async makeLandmarks(
    geojsons: GeoJSON.FeatureCollection<any>[]
  ): Promise<void> {
    for (const geojson of geojsons) {
      // 🔥 non-standard GeoJSON field for convenience
      const filename = geojson['filename']
        .toUpperCase()
        .substring(0, geojson['filename'].indexOf('.'));
      // 👇 cancel??
      if (this.cancelling) break;
      // 👇 for each feature imported
      for (const feature of geojson.features) {
        if (this.cancelling) break;
        this.numImported += 1;
        this.#cdf.markForCheck();
        // 👇 potentially one culvert per feature
        const importHash = hash.MD5(feature as any);
        const alreadyImported = await this.alreadyImported(importHash);
        // 👇 only if not already imported
        if (!alreadyImported) {
          const landmark: Partial<Landmark> = {
            geometry: feature.geometry,
            owner: this.#authState.currentProfile().email,
            path: this.map.path(),
            type: 'Feature'
          };
          let properties;
          // 👇 only import waypoints
          switch (feature.geometry?.type) {
            case 'Point':
              properties = {
                metadata: this.#makeCulvertProperties(
                  feature.properties.keywords ?? filename,
                  feature.properties.name,
                  feature.properties.description /* 👈 KML */ ??
                    feature.properties.desc /* 👈 GPX */
                )
              };
              break;
          }
          // 👇 add the landmark if all above conditions met
          if (properties) {
            landmark.id = makeLandmarkID(landmark);
            landmark.importHash = importHash;
            landmark.properties = properties;
            await firstValueFrom(
              this.#store.dispatch(new AddLandmark(landmark))
            );
          }
        }
      }
    }
  }

  #makeCulvertProperties(
    location: string,
    props: string,
    description = ''
  ): Partial<CulvertProperties> {
    // 👇 split props and eliminate decoration and smart quotes
    const parts = props
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<\./g, '')
      .replace(/<br>/g, '')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .trim()
      .split(/[\n ]+/);
    // 👇 model culvert
    const properties: CulvertProperties = {
      condition: culvertConditions[0],
      count: 1,
      description: description
        .replace(/<div>/g, '')
        .replace(/<\/div>/g, '')
        .replace(/&nbsp;/g, ' '),
      diameter: 0,
      floodHazard: culvertFloodHazards[0],
      headwall: culvertHeadwalls[0],
      height: 0,
      length: 0,
      location,
      material: culvertMaterials[0],
      type: 'culvert',
      width: 0,
      year: null
    };
    // 👇 the data in each part is unambiguous with respect to culvert property
    parts.forEach((part: any) => {
      part = part.trim();
      part = `${part.substring(0, 1).toUpperCase()}${part
        .substring(1)
        .toLowerCase()}`;
      if (culvertConditions.includes(part)) properties.condition = part;
      if (/^[\d]+x$/.test(part))
        properties.count = Number(part.substring(0, part.length - 1));
      if (/^[\d]+"$/.test(part))
        properties.diameter = Number(part.substring(0, part.length - 1));
      if (/^[\d]+["']?x[\d]+["']?$/.test(part)) {
        const dims = part.replaceAll(/["']/g, '').split('x');
        properties.height = Number(dims[1]);
        properties.width = Number(dims[0]);
        // 👇 convert to inches if in feet
        if (properties.height < 12) properties.height *= 12;
        if (properties.width < 12) properties.width *= 12;
      }
      if (culvertFloodHazards.includes(part)) properties.floodHazard = part;
      if (culvertHeadwalls.includes(part)) properties.headwall = part;
      if (/^[\d]+'$/.test(part))
        properties.length = Number(part.substring(0, part.length - 1));
      if (culvertMaterials.includes(part)) properties.material = part;
      if (/^\d{4}$/.test(part)) properties.year = Number(part);
    });
    return properties;
  }
}
