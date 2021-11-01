import { AuthState } from '../state/auth';
import { ContextMenuComponent } from './contextmenu-component';
import { Descriptor } from '../services/typeregistry';
import { DestroyService } from '../services/destroy';
import { Parcel } from '../state/parcels';
import { ParcelProperties } from '../state/parcels';
import { Profile } from '../state/auth';
import { TypeRegistry } from '../services/typeregistry';

import { AngularFirestore } from '@angular/fire/firestore';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';

import { map } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
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

  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() path: string;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  record: Record<string, Value> = {};

  @Input() selectedIDs: string[];

  constructor(
    private firestore: AngularFirestore,
    private destroy$: DestroyService,
    public registry: TypeRegistry
  ) {}

  #handleParcels$(): void {
    this.profile$
      .pipe(
        takeUntil(this.destroy$),
        mergeMap((profile) => {
          if (!profile?.email) return of([]);
          else {
            const workgroup = AuthState.workgroup(profile);
            const query = (ref): any =>
              ref
                .where('id', 'in', this.selectedIDs)
                // 🔥 crap! can't use more than one "in"
                //    .where('owner', 'in', workgroup)
                .where('path', '==', this.path)
                .orderBy('timestamp');
            return this.firestore
              .collection<Parcel>('parcels', query)
              .valueChanges()
              .pipe(
                map((parcels) =>
                  parcels.filter((parcel) => workgroup.includes(parcel.owner))
                )
              );
          }
        })
      )
      .subscribe((parcels: Parcel[]) => {
        console.log(parcels);
      });
  }

  #initializeRecordFromFeatures(): void {
    this.#flds.forEach((fld) => {
      this.record[fld] = {
        conflict: false,
        fromFeatures: undefined,
        fromParcels: undefined,
        list: this.registry.list('parcel', fld)
      };
      this.features.forEach((feature) => {
        const value = this.record[fld];
        const fromFeature = feature.getProperties()[fld];
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
  }

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#handleParcels$();
    this.#initializeRecordFromFeatures();
  }

  save(record: Record<string, Value>): void {
    this.features.forEach((feature) => {
      const parcel: Parcel = {
        geometry: null,
        id: feature.getId(),
        owner: 'xxx',
        path: this.path,
        properties: {} as ParcelProperties,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'Feature'
      };
      this.#flds.forEach((fld) => {
        const fromParcels = record[fld].fromParcels;
        if (fromParcels !== undefined) parcel.properties[fld] = fromParcels;
      });
      console.log({ parcel });
    });
  }
}
