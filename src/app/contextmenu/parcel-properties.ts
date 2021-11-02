import { AuthState } from '../state/auth';
import { ContextMenuComponent } from './contextmenu-component';
import { Descriptor } from '../services/typeregistry';
import { DestroyService } from '../services/destroy';
import { OLMapComponent } from '../ol/ol-map';
import { Parcel } from '../state/parcels';
import { ParcelProperties } from '../state/parcels';
import { ParcelsState } from '../state/parcels';
import { TypeRegistry } from '../services/typeregistry';

import { AngularFirestore } from '@angular/fire/firestore';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';

import firebase from 'firebase/app';
import OLFeature from 'ol/Feature';

interface Value {
  conflict: boolean;
  fromFeatures: any;
  fromParcels: any;
  label: string;
  list: [any, Descriptor][];
  prop: string;
  refCount: number;
}

type ValueRecord = Record<string, Value>;

// 👇 these are the properties we can editable

const editables = [
  { prop: 'address', label: 'Parcel Address' },
  { prop: 'owner', label: 'Parcel Owner' },
  { prop: 'usage', label: 'Land Use' },
  { prop: 'use', label: 'Current Use' }
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
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

  @Input() selectedIDs: string[];

  constructor(
    private authState: AuthState,
    private destroy$: DestroyService,
    private firestore: AngularFirestore,
    public registry: TypeRegistry
  ) {}

  #groupByID<T>(things: T[]): Record<string, T[]> {
    return things.reduce((acc, thing) => {
      if (!acc[thing['id']]) acc[thing['id']] = [];
      acc[thing['id']].push(thing);
      return acc;
    }, {} as Record<string, T[]>);
  }

  #handleParcels$(): void {
    this.parcels$
      .pipe(
        takeUntil(this.destroy$),
        map(
          (parcels): Record<string, Parcel[]> =>
            this.#groupByID<Parcel>(parcels)
        )
      )
      .subscribe((parcelsByID) => {
        this.record = this.#makeRecordFromParcels(
          parcelsByID,
          this.#makeRecordFromFeatures()
        );
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
        refCount: 0
      };
      // 👉 scan the input features -- these are the ones selected
      this.features.forEach((feature) => {
        const id = feature.getId() as string;
        const value = record[prop];
        const originalFeature = this.map.getOriginalFeature(id);
        // 👉 take the feature value from the original (if overridden)
        //    or directly from the input feature (if not)
        const fromFeature =
          originalFeature?.properties[prop] ?? feature.getProperties()[prop];
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

  #makeRecordFromParcels(
    parcelsByID: Record<string, Parcel[]>,
    record: ValueRecord
  ): ValueRecord {
    editables.forEach((editable) => {
      const prop = editable.prop;
      const value = record[prop];
      this.selectedIDs.forEach((id) => {
        const parcels = parcelsByID[id];
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

  clear(event: MouseEvent, value: Value): void {
    value.fromParcels = null;
    const control = this.propertiesForm.controls[value.prop];
    control.setValue(null);
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
    const batch = this.firestore.firestore.batch();
    // 👇 we'll potentially save a parcel override per feature
    this.features.forEach((feature) => {
      const parcel: Parcel = {
        id: feature.getId(),
        owner: this.authState.currentProfile().email,
        path: this.map.path,
        properties: {} as ParcelProperties,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'Feature'
      };
      // ... with a property for each modified editable
      editables.forEach((editable) => {
        const prop = editable.prop;
        if (this.propertiesForm.controls[prop]?.dirty) {
          const fromParcels = record[prop].fromParcels;
          if (fromParcels !== undefined) parcel.properties[prop] = fromParcels;
        }
      });
      // 👉 https://stackoverflow.com/questions/47268241/
      //    only save if at least one property override
      if (Object.keys(parcel.properties).length > 0) {
        const ref = this.firestore.collection('parcels').doc().ref;
        ref.set(parcel);
      }
    });
    batch.commit();
  }
}
