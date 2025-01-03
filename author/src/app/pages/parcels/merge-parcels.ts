import { SidebarComponent } from '../../components/sidebar-component';

import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { OLMapComponent } from '@lib/ol/ol-map';
import { Parcel } from '@lib/common';
import { ParcelID } from '@lib/common';
import { ParcelsActions } from '@lib/state/parcels';
import { Store } from '@ngxs/store';

import { featureCollection } from '@turf/helpers';
import { inject } from '@angular/core';
import { union } from '@turf/union';

import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';

interface MergeRecord {
  mergedID: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-merge-parcels',
  template: `
    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'object-group']" size="2x"></fa-icon>
      </figure>

      <p class="title">Merge parcels</p>
      <p class="subtitle">{{ selectedIDs.join(', ') }}</p>
    </header>

    <form
      #mergeForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="save(record)"
      autocomplete="off"
      class="form"
      id="mergeForm"
      novalidate
      spellcheck="false">
      <p class="instructions">
        Indicate which parcel will remain after the merge is complete. Then use
        <em>Modify parcel settings</em>
        to complete the merge.
      </p>

      <mat-radio-group
        [(ngModel)]="record.mergedID"
        class="ids"
        name="targetID">
        @for (id of selectedIDs; track id) {
          <mat-radio-button [value]="id">{{ id }}</mat-radio-button>
        }
      </mat-radio-group>
    </form>

    <article class="actions">
      <button (click)="cancel()" mat-flat-button>Cancel</button>

      <button
        [disabled]="!mergeForm.dirty"
        color="primary"
        form="mergeForm"
        mat-flat-button
        type="submit">
        Save
      </button>
    </article>
  `,
  styles: [
    `
      .ids {
        display: grid;
        gap: 1rem;
        grid-template-columns: 33.3% 33.3% 33.3%;
      }
    `
  ],
  standalone: false
})
export class MergeParcelsComponent implements SidebarComponent {
  drawer: MatDrawer;
  features: OLFeature<any>[];
  map: OLMapComponent;
  record: MergeRecord = {
    mergedID: null
  };
  selectedIDs: ParcelID[];

  #authState = inject(AuthState);
  #store = inject(Store);

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
        owner: this.#authState.currentProfile().email,
        path: this.map.path(),
        type: 'Feature'
      };
    });
    // 👉 this is a model for the parcel that will remain
    //    details filled in later
    const mergedParcel: Parcel = {
      action: 'modified',
      id: record.mergedID,
      owner: this.#authState.currentProfile().email,
      path: this.map.path(),
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
      union(featureCollection([acc, geojson]))
    ).geometry;
    // 👉 that's it!
    this.#store.dispatch(
      new ParcelsActions.AddParcels([mergedParcel, ...removedParcels])
    );
    this.drawer.close();
  }
}
