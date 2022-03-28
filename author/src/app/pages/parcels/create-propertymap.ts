import { ContextMenuComponent } from './contextmenu-component';

import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { CreateMap } from '@lib/state/map';
import { DestroyService } from '@lib/services/destroy';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { ParcelID } from '@lib/geojson';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { bboxByAspectRatio } from '@lib/geojson';

import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import union from '@turf/union';

interface PropertyMapRecord {
  bbox: Coordinate;
  id: string;
  isDflt: boolean;
  name: string;
  parcelIDs: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-create-propertymap',
  styleUrls: [
    './create-propertymap.scss',
    '../../../../../lib/css/sidebar.scss'
  ],
  templateUrl: './create-propertymap.html'
})
export class CreatePropertyMapComponent
  implements ContextMenuComponent, OnInit
{
  @ViewChild('createForm', { static: true }) createForm: NgForm;

  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  record: PropertyMapRecord = {
    bbox: [],
    id: null,
    isDflt: true,
    name: null,
    parcelIDs: null
  };

  @Input() selectedIDs: ParcelID[];

  constructor(private authState: AuthState, private store: Store) {}

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    // 👉 union all the selected features to get the bbox
    const format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
    const geojsons = this.features.map((feature) =>
      JSON.parse(format.writeFeature(feature))
    );
    const merged: any = {
      geometry: geojsons.reduce((acc, geojson) => union(acc, geojson)).geometry,
      properties: {},
      type: 'Feature'
    };
    const border = 200 * 0.0003048; /* 👈 feet to kilometers */
    this.record.bbox = bboxByAspectRatio(merged, 4, 3, border);
    this.record.parcelIDs = this.selectedIDs.join('\n');
  }

  refresh(): void {}

  save(record: PropertyMapRecord): void {
    const map: Map = {
      bbox: record.bbox,
      id: record.id,
      isDflt: record.isDflt,
      name: record.name,
      owner: this.authState.currentProfile().email,
      parcelIDs: record.parcelIDs.split(/[\n, ]+/g),
      path: this.map.path,
      type: 'property'
    };
    this.store.dispatch(new CreateMap(map));
    this.drawer.close();
  }
}
