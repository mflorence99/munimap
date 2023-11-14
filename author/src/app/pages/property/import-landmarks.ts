import { SidebarComponent } from '../../components/sidebar-component';

import { AddLandmark } from '@lib/state/landmarks';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Input } from '@angular/core';
import { Landmark } from '@lib/common';
import { LandmarkPropertiesClass } from '@lib/common';
import { MatDrawer } from '@angular/material/sidenav';
import { OLMapComponent } from '@lib/ol/ol-map';
import { Store } from '@ngxs/store';

import { collection } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { getDocs } from '@angular/fire/firestore';
import { makeLandmarkID } from '@lib/common';
import { query } from '@angular/fire/firestore';
import { where } from '@angular/fire/firestore';

import Feature from 'ol/Feature';
import hash from 'object-hash';
import JSZip from 'jszip';
import toGeoJSON from '@mapbox/togeojson';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-import-landmarks',
  styleUrls: ['./import-landmarks.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './import-landmarks.html'
})
export class ImportLandmarksComponent implements SidebarComponent {
  @Input() drawer: MatDrawer;
  @Input() features: Feature<any>[];
  @Input() map: OLMapComponent;
  @Input() selectedIDs: (string | number)[];

  cancelling = false;

  errorMessages: string[] = [];

  files: File[] = [];

  importing = false;

  numImported = 0;
  numImporting = 0;

  // 👇 checkbox by file name for selection post-native dialog
  record: Record<string, boolean> = {};

  constructor(
    protected authState: AuthState,
    protected cdf: ChangeDetectorRef,
    protected firestore: Firestore,
    protected store: Store
  ) {}

  // 🔥 this is a bit redundant now as makeLandmarkID() ONLY
  //    allows one landmark with the same geometry to be uploaded
  //    but we're not ready to give up on it yet
  async alreadyImported(importHash: string): Promise<boolean> {
    const workgroup = AuthState.workgroup(this.authState.currentProfile());
    console.log(
      `%cFirestore query: landmarks where owner in ${JSON.stringify(
        workgroup
      )} and importHash = ${importHash}`,
      'color: goldenrod'
    );
    const docs = await getDocs(
      query(
        collection(this.firestore, 'landmarks'),
        where('owner', 'in', workgroup),
        where('importHash', '==', importHash)
      )
    );
    return !docs.empty;
  }

  async analyzeImports(record: any): Promise<GeoJSON.FeatureCollection<any>[]> {
    const geojsons: GeoJSON.FeatureCollection<any>[] = [];
    try {
      for (const file of this.files) {
        if (this.cancelling) break;
        if (record[file.name]) {
          // 👇 decompress ZIP files
          if (file.name.toLowerCase().endsWith('.zip')) {
            const zip = await JSZip.loadAsync(file);
            const entries = zip.filter(
              (path) =>
                path.toLowerCase().endsWith('.gpx') ||
                path.toLowerCase().endsWith('.kml')
            );
            if (entries.length === 0)
              this.errorMessages.push(
                `No GPX or KML data found in ${file.name}`
              );
            else {
              // 🔥 NOTE EasyTrails hack where we only take the first of
              //    Waypoint.gpx or Waypoint.kml
              if (file.name.startsWith('EasyTrailsGPS_exported'))
                entries.length = 1;
              // 👇 convert each entry to GeoJSON
              for (const entry of entries) {
                const raw = await entry.async('text');
                const xml = new DOMParser().parseFromString(raw, 'text/xml');
                geojsons.push(
                  entry.name.toLowerCase().endsWith('.gpx')
                    ? toGeoJSON.gpx(xml)
                    : toGeoJSON.kml(xml)
                );
              }
            }
          }
          // 👇 read GPX and KML files directly
          else {
            const raw = await file.text();
            const xml = new DOMParser().parseFromString(raw, 'text/xml');
            geojsons.push(
              file.name.toLowerCase().endsWith('.gpx')
                ? toGeoJSON.gpx(xml)
                : toGeoJSON.kml(xml)
            );
          }
        }
      }
      return geojsons;
    } catch (error) {
      this.errorMessages.push(error.message);
      return [];
    }
  }

  atLeastOneSelected(): boolean {
    return Object.values(this.record).some((checked) => checked);
  }

  cancel(): void {
    if (this.importing) this.cancelling = true;
    else this.drawer.close();
  }

  async import(record: any): Promise<void> {
    this.cancelling = false;
    this.errorMessages = [];
    this.importing = true;
    this.numImported = 0;
    this.numImporting = 0;
    const geojsons = await this.analyzeImports(record);
    this.numImporting = geojsons.reduce(
      (acc, geojson) => acc + geojson.features.length,
      0
    );
    this.cdf.markForCheck();
    await this.makeLandmarks(geojsons);
    this.cancelling = false;
    this.importing = false;
    this.cdf.markForCheck();
    if (this.errorMessages.length === 0) this.cancel();
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
        const importHash = hash.MD5(feature as any);
        const alreadyImported = await this.alreadyImported(importHash);
        if (!alreadyImported) {
          // 👇 yes, I know this looks identical to the code in
          //    ol-interaction-drawlandmarks -- but we MAY want
          // imported landmarks to look different to drawn ones
          const landmark: Partial<Landmark> = {
            geometry: feature.geometry,
            owner: this.authState.currentProfile().email,
            path: this.map.path,
            type: 'Feature'
          };
          let properties;
          switch (feature.geometry?.type) {
            case 'Point':
              properties = new LandmarkPropertiesClass({
                fontColor: '--rgb-blue-gray-800',
                fontOpacity: 1,
                fontOutline: true,
                fontSize: 'large',
                fontStyle: 'bold'
              });
              break;
            case 'LineString':
              properties = new LandmarkPropertiesClass({
                fontColor: '--rgb-blue-gray-800',
                fontOpacity: 1,
                fontOutline: true,
                fontSize: 'medium',
                fontStyle: 'italic',
                lineChunk: true,
                lineDash: [1, 1],
                lineSpline: true,
                showDimension: true,
                strokeColor: '--rgb-blue-gray-800',
                strokeOpacity: 1,
                strokeStyle: 'dashed',
                strokeWidth: 'medium'
              });
              break;
            case 'Polygon':
              properties = new LandmarkPropertiesClass({
                fillColor: '--rgb-blue-gray-600',
                fillOpacity: 0.15,
                fontColor: '--rgb-blue-gray-800',
                fontOpacity: 1,
                fontOutline: true,
                fontSize: 'medium',
                fontStyle: 'normal',
                lineDash: [1, 1],
                showDimension: true,
                strokeColor: '--rgb-blue-gray-800',
                strokeOpacity: 1,
                strokeStyle: 'dashed',
                strokeWidth: 'medium',
                textRotate: true
              });
              break;
          }
          // 👇 add the landmark if it fits our profile
          if (properties) {
            landmark.id = makeLandmarkID(landmark);
            landmark.importHash = importHash;
            landmark.properties = {
              ...properties,
              name: feature.properties?.name ?? 'Imported Landmark'
            };
            await firstValueFrom(
              this.store.dispatch(new AddLandmark(landmark))
            );
          }
        }
      }
    }
  }

  refresh(): void {}

  setImportedFiles(fileList: FileList): void {
    this.files = Array.from(fileList);
    // 👇 all files initially selected
    this.record = this.files.reduce((acc, file) => {
      acc[file.name] = true;
      return acc;
    }, {});
  }
}
