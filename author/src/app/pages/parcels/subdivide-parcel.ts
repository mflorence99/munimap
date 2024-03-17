import { SidebarComponent } from '../../components/sidebar-component';

import { AddParcels } from '@lib/state/parcels';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/common';
import { ParcelID } from '@lib/common';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { inject } from '@angular/core';
import { randomPoint } from '@turf/random';
import { transformExtent } from 'ol/proj';

import intersect from '@turf/intersect';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import voronoi from '@turf/voronoi';

interface Subdivision {
  area: number;
  id: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-subdivide-parcel',
  template: `
    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'object-ungroup']" size="2x"></fa-icon>
      </figure>

      <p class="title">Subdivide parcel</p>
      <p class="subtitle">{{ selectedIDs.join(', ') }}</p>
    </header>

    <form
      #subdivisionForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="save(subdivisions)"
      class="form"
      id="subdivisionForm"
      novalidate
      spellcheck="false">
      <p class="instructions">
        Specify the ID and acreage of each subdivision. After
        <em>SAVE</em>
        , use
        <em>Redraw parcel boundary</em>
        and
        <em>Modify parcel settings</em>
        to complete the subdivision.
      </p>

      <article class="subdivisions">
        @for (
          subdivision of subdivisions;
          track subdivision.id;
          let ix = $index
        ) {
          <mat-form-field>
            <mat-label>Subdivision</mat-label>
            <input
              #subdivisionID="ngModel"
              [(ngModel)]="subdivision.id"
              [appAutoFocus]="ix === 0"
              [appParcelID]="[$any(map.searcher()), subdivision.id]"
              [appSelectOnFocus]="true"
              [appSubdivisionID]="[subdivisions, ix]"
              [name]="'id' + ix"
              [required]="ix < 2"
              autocomplete="off"
              matInput
              type="text" />
            @if (subdivisionID.errors?.duplicate) {
              <mat-error>Subdivision ID is a duplicate.</mat-error>
            }
          </mat-form-field>

          <mat-form-field>
            <mat-label>Acreage</mat-label>
            <input
              #area="ngModel"
              [(ngModel)]="subdivision.area"
              [appSelectOnFocus]="true"
              [name]="'area' + ix"
              [required]="ix < 2"
              [step]="0.01"
              autocomplete="off"
              matInput
              type="number" />
          </mat-form-field>
        }
      </article>
    </form>

    <article class="actions">
      <a (click)="more()" mat-flat-button>More &hellip;</a>

      <div class="filler"></div>

      <button (click)="cancel()" mat-flat-button>CANCEL</button>

      <button
        [disabled]="subdivisionForm.invalid || !subdivisionForm.dirty"
        color="primary"
        form="subdivisionForm"
        mat-flat-button
        type="submit">
        SAVE
      </button>
    </article>
  `,
  styles: [
    `
      .filler {
        flex-grow: 1;
      }

      .subdivisions {
        display: grid;
        grid-template-columns: auto auto;
        justify-content: space-between;

        .mat-mdc-form-field {
          width: 10rem;
        }
      }
    `
  ],
  styleUrls: ['../../../../../lib/css/sidebar.scss']
})
export class SubdivideParcelComponent implements SidebarComponent, OnInit {
  @ViewChild('subdivisionForm') subdivisionForm: NgForm;

  drawer: MatDrawer;
  features: OLFeature<any>[];
  map: OLMapComponent;
  selectedIDs: ParcelID[];
  subdivisions: Subdivision[];

  #authState = inject(AuthState);
  #format: OLGeoJSON;
  #store = inject(Store);

  cancel(): void {
    this.drawer.close();
  }

  more(): void {
    this.subdivisions.push({ area: null, id: null });
  }

  ngOnInit(): void {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
    const source = this.features[0];
    this.subdivisions = [
      {
        area: source.getProperties().area,
        id: `${source.getId()}`
      },
      {
        area: null,
        id: null
      }
    ];
  }

  refresh(): void {}

  // 👇 the idea is that subdivision is a two-part process
  //    first, right here, we subdivide into N random polygons
  //    then later the user will adjust the lot lines

  save(subdivisions: Subdivision[]): void {
    // 👉 trim out excess subdivisions
    while (!subdivisions[subdivisions.length - 1].id) subdivisions.length -= 1;
    // 👉 we need the bbox b/c we can only draw random points inside a box
    const bbox: any = transformExtent(
      this.features[0].getGeometry().getExtent(),
      this.map.projection,
      this.map.featureProjection
    );
    // 👉 there's guaranteed to be only one selected parcel
    const source = this.features[0];
    const sourceGeoJSON = JSON.parse(
      this.#format.writeFeature(this.features[0])
    );
    // 👉 keep creating voronoi ploygons until we have enough
    //    reason: a randpom point may fall outside the source
    let targetGeoJSONs = [];
    for (let ix = 0; targetGeoJSONs.length < subdivisions.length; ix++) {
      const randomPoints = randomPoint(subdivisions.length + ix, { bbox });
      targetGeoJSONs = voronoi(randomPoints, { bbox }).features.map((polygon) =>
        intersect(polygon, sourceGeoJSON)
      );
    }
    // 👉 trim any excess
    targetGeoJSONs.length = subdivisions.length;
    // 👉 if the source parcel ID is subsumed in the subdivision
    //    then we'll remove it
    const removedParcels: Parcel[] = [];
    if (
      subdivisions.every((subdivision) => subdivision.id !== source.getId())
    ) {
      removedParcels.push({
        action: 'removed',
        id: source.getId(),
        owner: this.#authState.currentProfile().email,
        path: this.map.path(),
        type: 'Feature'
      });
    }
    // 👉 create a new geometry for each subdivision
    const subdividedParcels: Parcel[] = targetGeoJSONs.map((geojson, ix) => {
      const props = source.getProperties();
      const subdivision = subdivisions[ix];
      return {
        action: subdivision.id !== source.getId() ? 'added' : 'modified',
        geometry: geojson.geometry,
        id: subdivision.id,
        owner: this.#authState.currentProfile().email,
        path: this.map.path(),
        properties: {
          address: props.address,
          area: subdivision.area ?? 1,
          county: props.county,
          id: subdivision.id,
          neighborhood: props.neighborhood,
          owner: props.owner,
          town: props.town,
          usage: props.usage,
          use: props.use,
          zone: props.zone
        },
        type: 'Feature'
      };
    });
    // that's it!
    this.#store.dispatch(
      new AddParcels([...removedParcels, ...subdividedParcels])
    );
    this.drawer.close();
  }
}
