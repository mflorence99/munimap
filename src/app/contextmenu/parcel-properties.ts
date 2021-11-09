import { AddParcels } from '../state/parcels';
import { AuthState } from '../state/auth';
import { ContextMenuComponent } from './contextmenu-component';
import { Descriptor } from '../services/typeregistry';
import { DestroyService } from '../services/destroy';
import { OLMapComponent } from '../ol/ol-map';
import { Parcel } from '../common';
import { ParcelID } from '../common';
import { ParcelsState } from '../state/parcels';
import { TypeRegistry } from '../services/typeregistry';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { ValuesPipe } from 'ngx-pipes';
import { ViewChild } from '@angular/core';

import { takeUntil } from 'rxjs/operators';

import OLFeature from 'ol/Feature';

interface Value {
  conflict: boolean;
  fromFeatures: any;
  fromParcels: any;
  label: string;
  list: [any, Descriptor][];
  prop: string;
  refCount: number;
  step: number;
  type: string;
}

type ValueRecord = Record<string, Value>;

// 👇 these are the properties we can editable

const editables = [
  { prop: 'address', label: 'Parcel Address', type: 'text' },
  { prop: 'owner', label: 'Parcel Owner', type: 'text' },
  { prop: 'area', label: 'Acreage', type: 'number', step: 0.01 },
  { prop: 'usage', label: 'Land Use' },
  { prop: 'use', label: 'Current Use' },
  { prop: 'building$', label: 'Building Tax', type: 'number' },
  { prop: 'land$', label: 'Land Tax', type: 'number' },
  { prop: 'other$', label: 'Other Tax', type: 'number' },
  { prop: 'taxed$', label: 'Total Tax', type: 'number' }
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService, ValuesPipe],
  selector: 'app-parcel-properties',
  styleUrls: ['./contextmenu-component.scss', './parcel-properties.scss'],
  templateUrl: './parcel-properties.html'
})
export class ParcelPropertiesComponent implements ContextMenuComponent, OnInit {
  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  @ViewChild('propertiesForm', { static: true }) propertiesForm: NgForm;

  record: ValueRecord = {};

  @Input() selectedIDs: ParcelID[];

  constructor(
    private authState: AuthState,
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private parcelsState: ParcelsState,
    public registry: TypeRegistry,
    private store: Store
  ) {}

  #handleParcels$(): void {
    this.parcels$.pipe(takeUntil(this.destroy$)).subscribe((parcels) => {
      this.record = this.#makeRecordFromParcels(
        parcels,
        this.#makeRecordFromFeatures()
      );
      this.cdf.detectChanges();
    });
  }

  #makeRecordFromFeatures(): ValueRecord {
    const record: ValueRecord = {};
    editables.forEach((editable) => {
      const prop = editable.prop;
      record[prop] = {
        conflict: false,
        fromFeatures: undefined,
        fromParcels: undefined,
        label: editable.label,
        list: this.registry.list('parcel', prop),
        prop: prop,
        refCount: 0,
        step: editable.step ?? 1,
        type: editable.type
      };
      // 👉 scan the input features -- these are the ones selected
      this.features.forEach((feature) => {
        // const id = feature.getId() as string;
        const value = record[prop];
        // const originalFeature = this.map.getOriginalFeature(id);
        // 👉 take the feature value from the original (if overridden)
        //    or directly from the input feature (if not)
        const originalProperties = feature.get('originalProperties');
        const fromFeature =
          originalProperties?.[prop] ?? feature.getProperties()[prop];
        // 👉 if no value has been recorded yet, take the first we see
        if (value.fromFeatures === undefined) value.fromFeatures = fromFeature;
        // 👉 but if the value is different, we have to record a conflict
        else if (value.fromFeatures !== fromFeature) {
          value.conflict = true;
          value.fromFeatures = null;
        }
      });
    });
    return record;
  }

  #makeRecordFromParcels(parcels: Parcel[], record: ValueRecord): ValueRecord {
    const modified = this.parcelsState.parcelsModified(parcels);
    editables.forEach((editable) => {
      const prop = editable.prop;
      const value = record[prop];
      this.selectedIDs.forEach((id) => {
        const parcels = modified[id];
        if (parcels) {
          // 👉 remember: we are travesing the parcel overrides in reverse
          //    timestamp order -- the first defined value wins
          parcels
            .filter((parcel) => parcel.properties?.[prop] !== undefined)
            .some((parcel) => {
              const fromParcel = parcel.properties[prop];
              // 👉 if no value has been recorded yet, take the first we see
              //    clear the conflict flag, we're looking at overrides now
              if (value.fromParcels === undefined) {
                value.conflict = false;
                value.fromParcels = fromParcel;
                value.refCount += 1;
                return true;
              }
              // 👉 otherwise record a conflict if there's a mismatch
              else if (value.fromParcels !== fromParcel) {
                value.conflict = true;
                value.fromFeatures = null;
                value.fromParcels = null;
                value.refCount += 1;
                return true;
              }
              // 👉 we really care only about the first override
              else {
                value.refCount += 1;
                return true;
              }
            });
        }
      });
      // 👉 record a conflict for a mismatch in parcel overrides
      if (value.refCount > 0 && value.refCount !== this.selectedIDs.length)
        value.conflict = true;
    });
    return record;
  }

  clear(event: MouseEvent, record: ValueRecord, prop: string): void {
    record[prop].fromParcels = null;
    const control = this.propertiesForm.controls[prop];
    control.markAsDirty();
    event.stopPropagation();
  }

  done(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#handleParcels$();
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
        if (control?.dirty) {
          const fromParcels = record[prop].fromParcels;
          if (fromParcels === null) parcel.properties[prop] = null;
          else if (fromParcels !== undefined)
            parcel.properties[prop] =
              editable.type === 'number' ? Number(fromParcels) : fromParcels;
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

  trackByOption(ix: number, option: [any, Descriptor]): string {
    return option[0];
  }

  trackByProp(ix: number, value: Value): string {
    return value.prop;
  }
}
