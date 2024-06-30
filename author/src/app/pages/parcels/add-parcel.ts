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

import { bbox } from '@turf/bbox';
import { bboxPolygon } from '@turf/bbox-polygon';
import { circle } from '@turf/circle';
import { convertArea } from '@turf/helpers';
import { inject } from '@angular/core';
import { toLonLat } from 'ol/proj';

import OLFeature from 'ol/Feature';

interface Addition {
  area: number;
  id: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-parcel',
  template: `
    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'plus-square']" size="2x"></fa-icon>
      </figure>

      <p class="title">New parcel</p>
      <p class="subtitle">
        Use the
        <fa-icon [icon]="['fad', 'undo']"></fa-icon>
        tool to reverse any changes
      </p>
    </header>

    <form
      #additionForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="save(addition)"
      class="form"
      id="additionForm"
      novalidate
      spellcheck="false">
      <p class="instructions">
        Specify the ID and acreage of the new parcel. After
        <em>SAVE</em>
        , use
        <em>Redraw parcel boundary</em>
        and
        <em>Modify parcel settings</em>
        to complete the addition.
      </p>

      <article class="addition">
        <mat-form-field>
          <mat-label>Parcel ID</mat-label>
          <input
            #parcelID="ngModel"
            [(ngModel)]="addition.id"
            [appAutoFocus]="true"
            [appParcelID]="[$any(map.searcher()), addition.id]"
            autocomplete="off"
            matInput
            name="id"
            type="text"
            required />
          @if (parcelID.errors?.duplicate) {
            <mat-error>Parcel ID is a duplicate.</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Acreage</mat-label>
          <input
            #area="ngModel"
            [(ngModel)]="addition.area"
            [step]="0.01"
            autocomplete="off"
            matInput
            name="area"
            type="number"
            required />
        </mat-form-field>
      </article>
    </form>

    <article class="actions">
      <button (click)="cancel()" mat-flat-button>CANCEL</button>

      <button
        [disabled]="additionForm.invalid || !additionForm.dirty"
        color="primary"
        form="additionForm"
        mat-flat-button
        type="submit">
        SAVE
      </button>
    </article>
  `,
  styles: [
    `
      .addition {
        display: grid;
        grid-template-columns: auto auto;
        justify-content: space-between;

        .mat-mdc-form-field {
          width: 10rem;
        }
      }
    `
  ]
})
export class AddParcelComponent implements SidebarComponent {
  addition: Addition = {} as Addition;
  drawer: MatDrawer;
  features: OLFeature<any>[];
  map: OLMapComponent;
  selectedIDs: ParcelID[];

  #authState = inject(AuthState);
  #store = inject(Store);

  cancel(): void {
    this.drawer.close();
  }

  refresh(): void {}

  // 👇 the idea is that parcel addition is a two-part process
  //    first, right here, we insert a feature (arbitrarily square)
  //    then later the user will adjust the lot lines

  save(addition: Addition): void {
    // 👇 create a square centered on the context menu of area equal
    //    to the given area of the addition
    const diameter = Math.sqrt(convertArea(addition.area, 'acres', 'miles'));
    const geojson = bboxPolygon(
      bbox(
        circle(toLonLat(this.map.contextMenuAt), diameter / 2, {
          steps: 16,
          units: 'miles'
        })
      )
    );
    // 👉 build the new parcel
    const addedParcel: Parcel = {
      action: 'added',
      geometry: geojson.geometry,
      id: addition.id,
      owner: this.#authState.currentProfile().email,
      path: this.map.path(),
      properties: {
        address: 'UNKNOWN',
        area: addition.area,
        county: this.map.path().split(':')[1],
        id: addition.id,
        neighborhood: '',
        owner: 'UNKNOWN',
        town: this.map.path().split(':')[2],
        usage: '110',
        use: '',
        zone: ''
      },
      type: 'Feature'
    };
    // that's it!
    this.#store.dispatch(new ParcelsActions.AddParcels([addedParcel]));
    this.drawer.close();
  }
}
