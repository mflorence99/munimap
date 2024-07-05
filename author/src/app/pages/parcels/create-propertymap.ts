import { SidebarComponent } from "../../components/sidebar-component";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { MatDrawer } from "@angular/material/sidenav";
import { ParcelID } from "@lib/common";
import { OLMapComponent } from "@lib/ol/ol-map";
import { AuthState } from "@lib/state/auth";
import { Map } from "@lib/state/map";
import { MapActions } from "@lib/state/map";
import { Store } from "@ngxs/store";

import { inject } from "@angular/core";
import { input } from "@angular/core";
import { bboxByAspectRatio } from "@lib/common";
import { featureCollection } from "@turf/helpers";
import { union } from "@turf/union";

import OLFeature from "ol/Feature";
import OLGeoJSON from "ol/format/GeoJSON";

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
  '12 x 18"': [12, 18],
  '16 x 20"': [16, 20],
  '18 x 24"': [18, 24],
  '22 x 28"': [22, 28],
  '24 x 24"': [24, 24],
  '24 x 36"': [24, 36],
  '30 x 40"': [30, 40],
  '40 x 60"': [40, 60],
  '45 x 60"': [45, 60],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-create-propertymap",
  template: `
    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'location-plus']" size="2x"></fa-icon>
      </figure>

      <p class="title">Create property map</p>
      <p class="subtitle">{{ selectedIDs.join(', ') }}</p>
    </header>

    <form
      #createForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="save(record)"
      autocomplete="off"
      class="form"
      id="createForm"
      novalidate
      spellcheck="false">
      <p class="instructions">
        Property parcels are initialized from those selected. After
        <em>SAVE</em>
        , use the
        <em>menu</em>
        to navgate to the new property map.
      </p>

      <mat-form-field>
        <mat-label>Give your map a name</mat-label>
        <input
          #name="ngModel"
          [(ngModel)]="record.name"
          [appAutoFocus]="true"
          autocomplete="off"
          matInput
          name="name"
          placeholder="eg: My Huge Estate"
          required />
        @if (name.errors) {
          <mat-error>A map name is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Assign an unique ID to your map</mat-label>
        <input
          #id="ngModel"
          [(ngModel)]="record.id"
          autocomplete="off"
          matInput
          name="id"
          pattern="[a-z0-9-_]+"
          placeholder="eg: rockefeller"
          required />
        @if (id.errors) {
          <mat-error>
            Use only lowercase letters and numbers, plus dash and underscore
          </mat-error>
        }
        @if (!id.errors) {
          <mat-hint>
            Viewer app URL:
            <em>https://{{ record.id }}.munimap.online</em>
          </mat-hint>
        }
      </mat-form-field>

      <br />

      <p class="instructions">Choose the format of the map.</p>

      <mat-radio-group
        [(ngModel)]="record.contours2ft"
        class="map-format"
        name="contours2ft"
        required>
        <mat-radio-button [value]="false">Hillshade</mat-radio-button>
        <mat-radio-button [value]="true">2ft contours</mat-radio-button>
      </mat-radio-group>

      <p class="instructions">
        Choose the size at which the map will be printed. The aspect ratio
        determines the map's boundary box. These sizes are all available via the
        <a
          href="https://www.posterburner.com/makecustomposters"
          target="_blank">
          PosterBurner
        </a>
        print service.
      </p>

      <mat-radio-group
        [(ngModel)]="record.printSize"
        class="print-sizes"
        name="printSize"
        required>
        @for (printSize of printSizes; track printSize) {
          <mat-radio-button [value]="printSize">
            {{ printSize }}
          </mat-radio-button>
        }
      </mat-radio-group>
    </form>

    <article class="actions">
      <button (click)="cancel()" mat-flat-button>CANCEL</button>

      <button
        [disabled]="createForm.invalid || !createForm.dirty"
        color="primary"
        form="createForm"
        mat-flat-button
        type="submit">
        SAVE
      </button>
    </article>
  `,
  styles: [
    `
      .map-format {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: 50% 50%;
        margin-bottom: 1rem;
      }

      .print-sizes {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: 33.3% 33.3% 33.3%;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class CreatePropertyMapComponent implements SidebarComponent {
  border = input(100);
  drawer: MatDrawer;
  features: OLFeature<any>[];
  map: OLMapComponent;
  record: PropertyMapRecord = {
    contours2ft: false,
    id: null,
    isDflt: true,
    name: null,
    printSize: null,
  };
  selectedIDs: ParcelID[];

  #authState = inject(AuthState);
  #store = inject(Store);

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
      featureProjection: this.map.projection,
    });
    const geojsons = this.features.map((feature) =>
      JSON.parse(format.writeFeature(feature)),
    );
    const bbox: any = {
      geometry: geojsons.reduce((acc, geojson) =>
        union(featureCollection([acc, geojson])),
      ).geometry,
      properties: {},
      type: "Feature",
    };
    // 👉 the bbox has a nominal Nft border
    const border = this.border() * 0.0003048; /* 👈 feet to kilometers */
    const printSize = PRINT_SIZES[record.printSize];
    // 👉 create the new property map
    const map: Map = {
      // ❗ must be larger dim first (as in 4:3)
      bbox: bboxByAspectRatio(bbox, printSize[1], printSize[0], border),
      contours2ft: record.contours2ft,
      id: record.id,
      isDflt: record.isDflt,
      name: record.name,
      owner: this.#authState.currentProfile().email,
      parcelIDs: this.selectedIDs,
      path: this.map.path(),
      printSize: printSize,
      type: "property",
    };
    this.#store.dispatch(new MapActions.CreateMap(map));
    this.drawer.close();
  }
}
