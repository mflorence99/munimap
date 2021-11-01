import { AuthState } from '../state/auth';
import { ContextMenuComponent } from './contextmenu-component';
import { Descriptor } from '../services/typeregistry';
import { DestroyService } from '../services/destroy';
import { Parcel } from '../state/parcels';
import { ParcelProperties } from '../state/parcels';
import { ParcelsState } from '../state/parcels';
import { TypeRegistry } from '../services/typeregistry';

import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFirestoreCollection } from '@angular/fire/firestore';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';

import { map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';

import firebase from 'firebase/app';
import OLFeature from 'ol/Feature';

interface Value {
  conflict: boolean;
  fromFeatures: any;
  fromParcels: any;
  list: [any, Descriptor][];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-parcel-properties',
  styleUrls: ['./contextmenu-component.scss', './parcel-properties.scss'],
  templateUrl: './parcel-properties.html'
})
export class ParcelPropertiesComponent implements ContextMenuComponent, OnInit {
  // TODO 🔥 temporary list of editable parcel fields
  #flds = ['address', 'owner', 'usage'];
  #parcels: AngularFirestoreCollection<Parcel>;

  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Select(ParcelsState.parcels) parcels$: Observable<Parcel[]>;

  @Input() path: string;

  record: Record<string, Value> = {};

  @Input() selectedIDs: string[];

  constructor(
    private authState: AuthState,
    private destroy$: DestroyService,
    private firestore: AngularFirestore,
    private parcelsState: ParcelsState,
    public registry: TypeRegistry
  ) {
    this.#parcels = this.firestore.collection<Parcel>('parcels');
  }

  #handleParcels$(): void {
    this.parcels$
      .pipe(
        takeUntil(this.destroy$),
        map((parcels) => {
          return parcels.filter((parcel) =>
            this.selectedIDs.includes(String(parcel.id))
          );
        })
      )
      .subscribe((parcels) => {
        this.record = this.#makeRecordFromParcels(
          parcels,
          this.#makeRecordFromFeatures()
        );
      });
  }

  #makeRecordFromFeatures(): Record<string, Value> {
    const record: Record<string, Value> = {};
    this.#flds.forEach((fld) => {
      record[fld] = {
        conflict: false,
        fromFeatures: undefined,
        fromParcels: undefined,
        list: this.registry.list('parcel', fld)
      };
      this.features.forEach((feature) => {
        const value = record[fld];
        const original = this.parcelsState.feature(
          this.path,
          String(feature.getId())
        );
        const fromFeature =
          original?.properties[fld] ?? feature.getProperties()[fld];
        if (value.fromFeatures === undefined) value.fromFeatures = fromFeature;
        else if (
          value.fromFeatures !== null &&
          value.fromFeatures !== fromFeature
        ) {
          value.conflict = true;
          value.fromFeatures = null;
        }
      });
    });
    return record;
  }

  #makeRecordFromParcels(
    parcels: Parcel[],
    record: Record<string, Value>
  ): Record<string, Value> {
    this.#flds.forEach((fld) => {
      parcels.forEach((parcel) => {
        if (parcel.properties[fld] !== undefined)
          record[fld].fromParcels = parcel.properties[fld];
      });
    });
    return record;
  }

  done(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#handleParcels$();
  }

  save(record: Record<string, Value>): void {
    this.features.forEach((feature) => {
      const parcel: Parcel = {
        id: feature.getId(),
        owner: this.authState.currentProfile().email,
        path: this.path,
        properties: {} as ParcelProperties,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'Feature'
      };
      this.#flds.forEach((fld) => {
        const fromParcels = record[fld].fromParcels;
        if (fromParcels !== undefined) parcel.properties[fld] = fromParcels;
      });
      this.#parcels.doc().set(parcel);
    });
  }
}
