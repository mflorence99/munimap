import { AddParcels } from '../state/parcels';
import { AuthState } from '../state/auth';
import { ContextMenuComponent } from './contextmenu-component';
import { OLMapComponent } from '../ol/ol-map';
import { Parcel } from '../common';
import { ParcelProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import OLFeature from 'ol/Feature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-unmerge-parcels',
  styleUrls: ['./contextmenu-component.scss', './unmerge-parcel.scss'],
  templateUrl: './unmerge-parcel.html'
})
export class UnmergeParcelComponent implements ContextMenuComponent {
  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @ViewChild('unmergeForm', { static: true }) mergeForm: NgForm;

  @Input() selectedIDs: string[];

  constructor(private authState: AuthState, private store: Store) {}

  cancel(): void {
    this.drawer.close();
  }

  save(): void {
    const restoredIDs = this.features[0].getProperties().mergedWith;
    // 👉 these are the parcels that were removed by the merge and will
    //    now be restored
    const restoredParcels: Parcel[] = restoredIDs.map((restoredID) => {
      return {
        id: restoredID,
        owner: this.authState.currentProfile().email,
        path: this.map.path,
        properties: {} as ParcelProperties,
        removed: null,
        type: 'Feature'
      };
    });
    const unmergedParcel: Parcel = {
      geometry: null,
      id: this.selectedIDs[0],
      owner: this.authState.currentProfile().email,
      path: this.map.path,
      properties: {
        area: null,
        mergedWith: null
      } as ParcelProperties,
      type: 'Feature'
    };
    // 👉 that's it!
    this.store.dispatch(new AddParcels([unmergedParcel, ...restoredParcels]));
    this.drawer.close();
  }
}
