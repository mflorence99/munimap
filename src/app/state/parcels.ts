import { AuthState } from './auth';
import { Map } from './map';
import { MapState } from './map';
import { Profile } from './auth';

import { Action } from '@ngxs/store';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFirestoreCollection } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { combineLatest } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';

import firebase from 'firebase/app';
import hash from 'object-hash';

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
  $id?: string /* 👈 optional only because we'll complete it */;
  geometryStr?: string /* 👈 Firebase won't let us store a real geometry */;
  owner: string;
  path: string;
  removed?: string | null | undefined;
  timestamp?: any /* 👈 optional only because we'll complete it */;
}

// 👉 https://stackoverflow.com/questions/43909566

class ParcelPropertiesClass {
  constructor(
    public abutters: string[] /* 👈 legacy support */ = null,
    public address: string = null,
    public area: number = null,
    public areaComputed: number = null,
    public building$: number = null,
    public callout: number[] /* 👈 legacy support */ = null,
    public center: number[] = null,
    public county: string = null,
    public cu$: number /* 👈 should be feature$ !! */ = null,
    public velevation: number = null,
    public id: string = null,
    public label: {
      rotate: boolean;
      split: boolean;
    } /* 👈 legacy support */ = null,
    public land$: number = null,
    public lengths: number[] = null,
    public mergedWith: string[] = null,
    public minWidth: number = null,
    public neighborhood: 'U' | 'V' | 'W' /* TODO 🔥 */ = null,
    public numSplits: number = null,
    public orientation: number = null,
    public owner: string = null,
    public perimeter: number = null,
    public sqarcity: number = null,
    public taxed$: number = null,
    public town: string = null,
    public usage: ParcelPropertiesUsage = null,
    public use: ParcelPropertiesUse = null,
    public zone: string = null
  ) {}
}

export interface ParcelProperties extends ParcelPropertiesClass {}

export const parcelProperties = Object.keys(new ParcelPropertiesClass());

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
  #parcels: AngularFirestoreCollection<Parcel>;

  @Select(MapState) map$: Observable<Map>;
  @Select(AuthState.profile) profile$: Observable<Profile>;

  constructor(private firestore: AngularFirestore, private store: Store) {
    this.#parcels = this.firestore.collection('parcels');
  }

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
              .valueChanges({ idField: '$id' });
          }
        }),
        // 👉 cut down on noise
        distinctUntilChanged((p, q): boolean => hash.MD5(p) === hash.MD5(q))
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
      this.#parcels.add(this.#normalize(parcel));
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
