import { ContextMenuComponent } from './contextmenu-component';

import { Actions } from '@ngxs/store';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { DestroyService } from '@lib/services/destroy';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { ParcelID } from '@lib/geojson';
import { Store } from '@ngxs/store';
import { UpdateMap } from '@lib/state/map';
import { ViewChild } from '@angular/core';

import { bboxByAspectRatio } from '@lib/geojson';
import { transformExtent } from 'ol/proj';

import OLFeature from 'ol/Feature';

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

  constructor(
    private actions$: Actions,
    private authState: AuthState,
    private destroy$: DestroyService,
    private dialog: MatDialog,
    private store: Store
  ) {}

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    const extent = transformExtent(
      this.map.olMap.getView().calculateExtent(),
      this.map.projection,
      this.map.featureProjection
    );
    this.record.bbox = bboxByAspectRatio(extent, 4, 3, 0);
    this.record.parcelIDs = this.selectedIDs.join('\n');
  }

  save(record): void {
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
    this.store.dispatch(new UpdateMap(map));
    this.drawer.close();
  }
}
