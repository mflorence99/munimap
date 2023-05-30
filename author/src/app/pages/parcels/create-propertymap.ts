import { SidebarComponent } from '../../components/sidebar-component';

import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { CreateMap } from '@lib/state/map';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { ParcelID } from '@lib/common';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { bboxByAspectRatio } from '@lib/common';

import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import union from '@turf/union';

interface PropertyMapRecord {
  contours2ft: boolean;
  id: string;
  isDflt: boolean;
  name: string;
  printSize: string;
}

const PRINT_SIZES = {
  '8\u00bd x 11"': [8.5, 11],
  '11 x 17"': [11, 17],
  '16 x 20"': [16, 20],
  '18 x 24"': [18, 24],
  '22 x 28"': [22, 28],
  '24 x 24"': [24, 24],
  '24 x 36"': [24, 36],
  '30 x 40"': [30, 40],
  '40 x 60"': [40, 60],
  '45 x 60"': [45, 60]
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-propertymap',
  styleUrls: [
    './create-propertymap.scss',
    '../../../../../lib/css/sidebar.scss'
  ],
  templateUrl: './create-propertymap.html'
})
export class CreatePropertyMapComponent implements SidebarComponent {
  @Input() border = 100 /* 👈 feet */;

  @ViewChild('createForm') createForm: NgForm;

  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @Input() selectedIDs: ParcelID[];

  record: PropertyMapRecord = {
    contours2ft: false,
    id: null,
    isDflt: true,
    name: null,
    printSize: null
  };

  constructor(private authState: AuthState, private store: Store) {}

  get printSizes(): string[] {
    return Object.keys(PRINT_SIZES);
  }

  cancel(): void {
    this.drawer.close();
  }

  refresh(): void {}

  save(record: PropertyMapRecord): void {
    // 👉 union all the selected features to get the bbox
    const format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
    const geojsons = this.features.map((feature) =>
      JSON.parse(format.writeFeature(feature))
    );
    const bbox: any = {
      geometry: geojsons.reduce((acc, geojson) => union(acc, geojson)).geometry,
      properties: {},
      type: 'Feature'
    };
    // 👉 the bbox has a nominal 500ft border
    const border = this.border * 0.0003048; /* 👈 feet to kilometers */
    const printSize = PRINT_SIZES[record.printSize];
    // 👉 create the new property map
    const map: Map = {
      // ❗ must be larger dim first (as in 4:3)
      bbox: bboxByAspectRatio(bbox, printSize[1], printSize[0], border),
      contours2ft: record.contours2ft,
      id: record.id,
      isDflt: record.isDflt,
      name: record.name,
      owner: this.authState.currentProfile().email,
      parcelIDs: this.selectedIDs,
      path: this.map.path,
      printSize: printSize,
      type: 'property'
    };
    this.store.dispatch(new CreateMap(map));
    this.drawer.close();
  }

  trackByID(ix: number, id: string): string {
    return id;
  }
}
