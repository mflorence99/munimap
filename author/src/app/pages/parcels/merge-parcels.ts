import { SidebarComponent } from '../../components/sidebar-component';

import { AddParcels } from '@lib/state/parcels';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { Parcel } from '@lib/common';
import { ParcelID } from '@lib/common';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import union from '@turf/union';

interface MergeRecord {
  mergedID: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-merge-parcels',
  styleUrls: ['./merge-parcels.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './merge-parcels.html'
})
export class MergeParcelsComponent implements SidebarComponent {
  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @ViewChild('mergeForm') mergeForm: NgForm;

  record: MergeRecord = {
    mergedID: null
  };

  @Input() selectedIDs: ParcelID[];

  constructor(private authState: AuthState, private store: Store) {}

  cancel(): void {
    this.drawer.close();
  }

  refresh(): void {}

  save(record: MergeRecord): void {
    const removedIDs = this.selectedIDs.filter((id) => id !== record.mergedID);
    // 👉 these are the parcels that will be removed after the merge
    const removedParcels: Parcel[] = removedIDs.map((removedID) => {
      return {
        action: 'removed',
        id: removedID,
        owner: this.authState.currentProfile().email,
        path: this.map.path,
        type: 'Feature'
      };
    });
    // 👉 this is a model for the parcel that will remain
    //    details filled in later
    const mergedParcel: Parcel = {
      action: 'modified',
      id: record.mergedID,
      owner: this.authState.currentProfile().email,
      path: this.map.path,
      properties: {},
      type: 'Feature'
    };
    // 👉 the new area will be the sum of the merged parcels
    mergedParcel.properties.area = this.features.reduce(
      (acc, feature) => acc + (feature.getProperties().area as number),
      0
    );
    // 👉 calculate new geometry as the union of all
    const geojsons = this.features.map((feature) => {
      const format = new OLGeoJSON({
        dataProjection: this.map.featureProjection,
        featureProjection: this.map.projection
      });
      return JSON.parse(format.writeFeature(feature));
    });
    mergedParcel.geometry = geojsons.reduce((acc, geojson) =>
      union(acc, geojson)
    ).geometry;
    // 👉 that's it!
    this.store.dispatch(new AddParcels([mergedParcel, ...removedParcels]));
    this.drawer.close();
  }

  trackByID(ix: number, id: string): string {
    return id;
  }
}
