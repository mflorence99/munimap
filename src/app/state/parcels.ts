import { AuthState } from './auth';
import { Map } from './map';
import { MapState } from './map';
import { Profile } from './auth';

import { Action } from '@ngxs/store';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';

import firebase from 'firebase/app';

export class AddParcels {
  static readonly type = '[Parcels] AddParcels';
  constructor(public parcels: Parcel[]) {}
}

export class SetParcels {
  static readonly type = '[Parcels] SetParcels';
  constructor(public parcels: Parcel[]) {}
}

export type Feature = GeoJSON.Feature<GeoJSON.Polygon, ParcelProperties>;

export type Features = GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  ParcelProperties
>;

export interface Parcel extends Partial<Feature> {
  owner: string;
  path: string;
  timestamp?: any /* 👈 optional only because we'll complete it */;
}

export interface ParcelProperties {
  abutters?: string[];
  address?: string;
  area: number;
  areaComputed: number;
  building$?: number;
  callout?: number[] /* 👈 legacy support */;
  center?: number[];
  class: string;
  county: string;
  cu$?: number /* 👈 should be feature$ !! */;
  elevation?: number;
  id: string;
  label?: { rotate: boolean; split: boolean } /* 👈 legacy support */;
  land$?: number;
  lengths?: number[];
  minWidth?: number;
  neighborhood?: 'U' | 'V' | 'W';
  numSplits: number;
  orientation?: number;
  owner?: string;
  perimeter?: number;
  sqarcity?: number;
  taxed$?: number;
  town: string;
  usage: ParcelPropertiesUsage;
  use?: ParcelPropertiesUse;
  zone: string;
}

export type ParcelPropertiesUsage =
  | '110' // Single family residence
  | '120' // Multi family residence
  | '130' // Other residential
  | '190' // Current use
  | '260' // Commercial / Industrial
  | '300' // Town property
  | '400' // State property
  | '500' // State park
  | '501' // Towm forest
  | '502'; // Conservation land

export type ParcelPropertiesUse =
  | 'CUDE' // Discretionary
  | 'CUFL' // Farm land
  | 'CUMH' // Managed hardwood
  | 'CUMO' // Managed other
  | 'CUMW' // Managed pine
  | 'CUNS' // Xmas tree
  | 'CUUH' // Unmanaged hardwood
  | 'CUUL' // Unproductive
  | 'CUUO' // Unmanaged other
  | 'CUUW' // Unmanaged pine
  | 'CUWL'; // Wetland

export type ParcelsStateModel = Parcel[];

@State<ParcelsStateModel>({
  name: 'parcels',
  defaults: []
})
@Injectable()
export class ParcelsState implements NgxsOnInit {
  @Select(MapState) map$: Observable<Map>;
  @Select(AuthState.profile) profile$: Observable<Profile>;

  constructor(private firestore: AngularFirestore, private store: Store) {}

  #handleStreams$(): void {
    combineLatest([this.map$, this.profile$])
      .pipe(
        mergeMap(([map, profile]) => {
          if (map === null) return of([]);
          else {
            const workgroup = AuthState.workgroup(profile);
            const query = (ref): any =>
              ref
                .where('owner', 'in', workgroup)
                .where('path', '==', map.path)
                .orderBy('timestamp', 'desc');
            return this.firestore
              .collection<Parcel>('parcels', query)
              .valueChanges()
              .pipe(debounceTime(1000));
          }
        })
      )
      .subscribe((parcels: Parcel[]) =>
        this.store.dispatch(new SetParcels(parcels))
      );
  }

  #normalize(parcel: Parcel): Parcel {
    parcel.timestamp = firebase.firestore.FieldValue.serverTimestamp();
    normalizeAddress(parcel);
    normalizeOwner(parcel);
    return parcel;
  }

  @Action(AddParcels) addParcels(
    ctx: StateContext<ParcelsStateModel>,
    action: AddParcels
  ): void {
    const batch = this.firestore.firestore.batch();
    action.parcels.forEach((parcel) => {
      const ref = this.firestore.collection('parcels').doc().ref;
      ref.set(this.#normalize(parcel));
    });
    // TODO 🔥 we have a great opportunity here to "cull"
    //         extraneous parcels
    batch.commit();
    // 👉 side-effect of handleStreams$ will update state
  }

  ngxsOnInit(): void {
    this.#handleStreams$();
  }

  @Action(SetParcels) setParcels(
    ctx: StateContext<ParcelsStateModel>,
    action: SetParcels
  ): void {
    ctx.setState(action.parcels);
  }
}

// TODO 🔥 is there a better place to put these normalizing functions?

function normalizeAddress(parcel: Parcel): void {
  if (parcel.properties.address) {
    let normalized = parcel.properties.address.trim().toUpperCase();
    normalized = normalized.replace(/\bCIR\b/, ' CIRCLE ');
    normalized = normalized.replace(/\bDR\b/, ' DRIVE ');
    normalized = normalized.replace(/\bE\b/, ' EAST ');
    normalized = normalized.replace(/\bHGTS\b/, ' HEIGHTS ');
    normalized = normalized.replace(/\bLN\b/, ' LANE ');
    normalized = normalized.replace(/\bMT\b/, ' MOUNTAIN ');
    normalized = normalized.replace(/\bN\b/, ' NORTH ');
    normalized = normalized.replace(/\bNO\b/, ' NORTH ');
    normalized = normalized.replace(/\bPD\b/, ' POND ');
    normalized = normalized.replace(/\bRD\b/, ' ROAD ');
    normalized = normalized.replace(/\bS\b/, ' SOUTH ');
    normalized = normalized.replace(/\bSO\b/, ' SOUTH ');
    normalized = normalized.replace(/\bST\b/, ' STREET ');
    normalized = normalized.replace(/\bTER\b/, ' TERRACE ');
    normalized = normalized.replace(/\bTERR\b/, ' TERRACE ');
    normalized = normalized.replace(/\bW\b/, ' WEST ');
    parcel.properties.address = normalized.replace(/  +/g, ' ').trim();
  }
}

function normalizeOwner(parcel: Parcel): void {
  if (parcel.properties.owner) {
    const normalized = parcel.properties.owner.trim().toUpperCase();
    parcel.properties.owner = normalized;
  }
}
