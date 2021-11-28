import { ContextMenuComponent } from './contextmenu-component';

import { AddParcels } from '@lib/state/parcels';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Descriptor } from '@lib/services/typeregistry';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/geojson';
import { ParcelID } from '@lib/geojson';
import { Store } from '@ngxs/store';
import { TypeRegistry } from '@lib/services/typeregistry';
import { ValuesPipe } from 'ngx-pipes';
import { ViewChild } from '@angular/core';

import OLFeature from 'ol/Feature';

interface Value {
  conflict: boolean;
  label: string;
  list: [any, Descriptor][];
  prop: string;
  step: number;
  type: string;
  value: any;
}

type ValueRecord = Record<string, Value>;

// 👇 these are the properties we can edit

const editables = [
  { prop: 'address', label: 'Parcel Address', type: 'text' },
  { prop: 'owner', label: 'Parcel Owner', type: 'text' },
  { prop: 'area', label: 'Acreage', type: 'number', step: 0.01 },
  { prop: 'usage', label: 'Land Use' },
  { prop: 'use', label: 'Current Use' },
  { prop: 'neighborhood', label: 'Neighborhood' },
  { prop: 'building$', label: 'Building Tax', type: 'number' },
  { prop: 'land$', label: 'Land Tax', type: 'number' },
  { prop: 'other$', label: 'Other Tax', type: 'number' },
  { prop: 'taxed$', label: 'Total Tax', type: 'number' }
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ValuesPipe],
  selector: 'app-parcel-properties',
  styleUrls: ['./contextmenu-component.scss', './parcel-properties.scss'],
  templateUrl: './parcel-properties.html'
})
export class ParcelPropertiesComponent implements ContextMenuComponent, OnInit {
  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @ViewChild('propertiesForm', { static: true }) propertiesForm: NgForm;

  record: ValueRecord = {};

  @Input() selectedIDs: ParcelID[];

  constructor(
    private authState: AuthState,
    private cdf: ChangeDetectorRef,
    public registry: TypeRegistry,
    private store: Store
  ) {}

  #makeRecord(): void {
    this.record = {};
    editables.forEach((editable) => {
      const prop = editable.prop;
      this.record[prop] = {
        conflict: false,
        label: editable.label,
        list: this.registry.list('parcel', prop),
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
        if (value.value === undefined) value.value = fromFeature;
        // 👉 but if the value is different, we have to record a conflict
        else if (value.value !== fromFeature) {
          value.conflict = true;
          value.value = undefined;
        }
      });
    });
  }

  done(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#makeRecord();
  }

  refresh(): void {
    this.#makeRecord();
    this.cdf.markForCheck();
  }

  save(record: ValueRecord): void {
    const parcels: Parcel[] = [];
    // 👇 we'll potentially save a parcel override per feature
    this.features.forEach((feature) => {
      const parcel: Parcel = {
        action: 'modified',
        id: feature.getId(),
        owner: this.authState.currentProfile().email,
        path: this.map.path,
        properties: {},
        type: 'Feature'
      };
      // 👇 some controls are conditional so they may no longer be
      //    in the form, in which case we don't record a value
      editables.forEach((editable) => {
        const prop = editable.prop;
        const control = this.propertiesForm.controls[prop];
        const value = record[prop].value;
        if (control?.dirty && value) {
          parcel.properties[prop] =
            editable.type === 'number' ? Number(value) : value;
        }
      });
      // 👉 only save if at least one property override
      if (Object.keys(parcel.properties).length > 0) parcels.push(parcel);
    });
    this.store.dispatch(new AddParcels(parcels, 'fromSidebar'));
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.propertiesForm.form.markAsPristine();
  }

  trackByOption(ix: number, option: [any, Descriptor]): string {
    return option[0];
  }

  trackByProp(ix: number, value: Value): string {
    return value.prop;
  }
}
