import { SidebarComponent } from "../../components/sidebar-component";

import { ChangeDetectionStrategy } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { MatDrawer } from "@angular/material/sidenav";
import { Parcel } from "@lib/common";
import { ParcelID } from "@lib/common";
import { OLMapComponent } from "@lib/ol/ol-map";
import { AuthState } from "@lib/state/auth";
import { ParcelsActions } from "@lib/state/parcels";
import { Store } from "@ngxs/store";
import { ValuesPipe } from "ngx-pipes";

import { inject } from "@angular/core";
import { viewChild } from "@angular/core";
import { parcelPropertiesUsage } from "@lib/common";
import { parcelPropertiesUse } from "@lib/common";

import OLFeature from "ol/Feature";

interface Value {
  conflict: boolean;
  label: string;
  list: Record<string, string>;
  prop: string;
  step: number;
  type: string;
  value: any;
}

type ValueRecord = Record<string, Value>;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ValuesPipe],
  selector: "app-parcel-properties",
  template: `
    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'tasks']" size="2x"></fa-icon>
      </figure>

      <p class="title">Modify parcel settings</p>
      <p class="subtitle">{{ selectedIDs.join(', ') }}</p>
    </header>

    @if (selectedIDs.length > 1) {
      <p class="instructions">
        All selected parcels will be modified with the same settings.
        <fa-icon [icon]="['fad', 'exclamation-triangle']"></fa-icon>
        indicates settings that are currently different.
      </p>
    }

    <form
      #propertiesForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="save(record)"
      [ngStyle]="{
        'grid-template-rows':
          'repeat(' + round(editables.length / 2) + ', auto)'
      }"
      autocomplete="off"
      class="form two-column"
      id="propertiesForm"
      novalidate
      spellcheck="false">
      @for (value of record | values; track value.prop; let ix = $index) {
        <!-- 
      👇 this control for props with a list 
        NOTE: use only appears if usage === current use
    -->
        @if (
          value.list && (value.prop !== 'use' || record.usage.value === '190')
        ) {
          <mat-form-field floatLabel="always">
            <mat-label>{{ value.label }}</mat-label>
            <mat-select
              [(ngModel)]="value.value"
              [attr.ngControl]="value.prop"
              [appAutoFocus]="ix === 0"
              [name]="value.prop">
              @for (option of value.list | keyvalue; track option.key) {
                <mat-option [value]="option.key">{{ option.value }}</mat-option>
              }
            </mat-select>
            @if (value.conflict) {
              <fa-icon
                [icon]="['fad', 'exclamation-triangle']"
                matSuffix></fa-icon>
            }
          </mat-form-field>
        }

        <!-- 👇 this control for type-in props -->
        @if (!value.list) {
          <mat-form-field floatLabel="always">
            <mat-label>{{ value.label }}</mat-label>
            <input
              [(ngModel)]="value.value"
              [attr.ngControl]="value.prop"
              [appAutoFocus]="ix === 0"
              [appSelectOnFocus]="true"
              [name]="value.prop"
              [type]="value.type ?? 'text'"
              [step]="value.step"
              matInput />
            @if (value.conflict) {
              <fa-icon
                [icon]="['fad', 'exclamation-triangle']"
                matSuffix></fa-icon>
            }
          </mat-form-field>
        }
      }
    </form>

    <article class="actions">
      <button (click)="cancel()" mat-flat-button>DONE</button>

      <button
        [disabled]="!propertiesForm.dirty"
        color="primary"
        form="propertiesForm"
        mat-flat-button
        type="submit">
        SAVE
      </button>
    </article>
  `
})
export class ParcelPropertiesComponent implements SidebarComponent, OnInit {
  drawer: MatDrawer;
  editables = [
    { prop: "address", label: "Parcel Address", type: "text" },
    { prop: "owner", label: "Parcel Owner", type: "text" },
    { prop: "addressOfOwner", label: "Owner Address", type: "text" },
    { prop: "area", label: "Acreage", type: "number", step: 0.01 },
    { prop: "usage", label: "Land Use", list: parcelPropertiesUsage },
    { prop: "use", label: "Current Use", list: parcelPropertiesUse },
    { prop: "neighborhood", label: "Neighborhood" },
    { prop: "building$", label: "Building", type: "number" },
    { prop: "land$", label: "Land", type: "number" },
    { prop: "other$", label: "Other", type: "number" },
    { prop: "taxed$", label: "Total", type: "number" }
  ];
  features: OLFeature<any>[];
  map: OLMapComponent;
  ngForm = viewChild<NgForm>("propertiesForm");
  record: ValueRecord = {};
  selectedIDs: ParcelID[];

  #authState = inject(AuthState);
  #cdf = inject(ChangeDetectorRef);
  #store = inject(Store);

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#makeRecord();
  }

  refresh(): void {
    this.#makeRecord();
    this.#cdf.markForCheck();
  }

  // 👇 why can't we use Math.round() in template!!
  round(n: number): number {
    return Math.round(n);
  }

  save(record: ValueRecord): void {
    const parcels: Parcel[] = [];
    // 👇 we'll potentially save a parcel override per feature
    this.features.forEach((feature) => {
      const parcel: Parcel = {
        action: "modified",
        id: feature.getId(),
        owner: this.#authState.currentProfile().email,
        path: this.map.path(),
        properties: {},
        type: "Feature"
      };
      // 👇 some controls are conditional so they may no longer be
      //    in the form, in which case we don't record a value
      this.editables.forEach((editable) => {
        const prop = editable.prop;
        const control = this.ngForm().controls[prop];
        const value = record[prop].value;
        if (control?.dirty && value) {
          parcel.properties[prop] =
            editable.type === "number" ? Number(value) : value;
        }
      });
      // 👉 only save if at least one property override
      if (Object.keys(parcel.properties).length > 0) parcels.push(parcel);
    });
    this.#store.dispatch(new ParcelsActions.AddParcels(parcels));
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.ngForm().form.markAsPristine();
  }

  #makeRecord(): void {
    this.record = {};
    this.editables.forEach((editable) => {
      const prop = editable.prop;
      this.record[prop] = {
        conflict: false,
        label: editable.label,
        list: editable.list,
        prop: prop,
        step: editable.step ?? 1,
        type: editable.type,
        value: undefined
      };
      // 👉 scan the input features -- these are the ones selected
      this.features.forEach((feature) => {
        const value = this.record[prop];
        const fromFeature = feature.getProperties()[prop];
        // 👉 if no value has been recorded yet, take the first we see
        if (!value.conflict && value.value === undefined)
          value.value = fromFeature;
        // 👉 but if the value is different, we have to record a conflict
        else if (value.value !== fromFeature) {
          value.conflict = true;
          value.value = undefined;
        }
      });
    });
  }
}
