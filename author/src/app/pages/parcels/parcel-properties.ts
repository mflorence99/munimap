import { SidebarComponent } from '../../components/sidebar-component';

import { AddParcels } from '@lib/state/parcels';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { KeyValue } from '@angular/common';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/common';
import { ParcelID } from '@lib/common';
import { Store } from '@ngxs/store';
import { ValuesPipe } from 'ngx-pipes';
import { ViewChild } from '@angular/core';

import { parcelPropertiesUsage } from '@lib/common';
import { parcelPropertiesUse } from '@lib/common';

import OLFeature from 'ol/Feature';

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
  selector: 'app-parcel-properties',
  styleUrls: [
    './parcel-properties.scss',
    '../../../../../lib/css/sidebar.scss'
  ],
  templateUrl: './parcel-properties.html'
})
export class ParcelPropertiesComponent implements SidebarComponent, OnInit {
  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @ViewChild('propertiesForm') propertiesForm: NgForm;

  @Input() selectedIDs: ParcelID[];

  editables = [
    { prop: 'address', label: 'Parcel Address', type: 'text' },
    { prop: 'owner', label: 'Parcel Owner', type: 'text' },
    { prop: 'addressOfOwner', label: 'Owner Address', type: 'text' },
    { prop: 'area', label: 'Acreage', type: 'number', step: 0.01 },
    { prop: 'usage', label: 'Land Use', list: parcelPropertiesUsage },
    { prop: 'use', label: 'Current Use', list: parcelPropertiesUse },
    { prop: 'neighborhood', label: 'Neighborhood' },
    { prop: 'building$', label: 'Building Tax', type: 'number' },
    { prop: 'land$', label: 'Land Tax', type: 'number' },
    { prop: 'other$', label: 'Other Tax', type: 'number' },
    { prop: 'taxed$', label: 'Total Tax', type: 'number' }
  ];

  record: ValueRecord = {};

  constructor(
    private authState: AuthState,
    private cdf: ChangeDetectorRef,
    private store: Store
  ) {}

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#makeRecord();
  }

  refresh(): void {
    this.#makeRecord();
    this.cdf.markForCheck();
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
        action: 'modified',
        id: feature.getId(),
        owner: this.authState.currentProfile().email,
        path: this.map.path,
        properties: {},
        type: 'Feature'
      };
      // 👇 some controls are conditional so they may no longer be
      //    in the form, in which case we don't record a value
      this.editables.forEach((editable) => {
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
    this.store.dispatch(new AddParcels(parcels));
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.propertiesForm.form.markAsPristine();
  }

  trackByOption(ix: number, option: KeyValue<string, string>): string {
    return option.key;
  }

  trackByProp(ix: number, value: Value): string {
    return value.prop;
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
    console.log({ record: this.record });
  }
}
