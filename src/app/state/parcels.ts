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
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { combineLatest } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { patch } from '@ngxs/store/operators';

export class AddFeature {
  static readonly type = '[Parcels] AddFeature';
  constructor(
    public path: string,
    public id: string,
    public feature: Feature
  ) {}
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
  timestamp: any;
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

export interface ParcelsStateModel {
  features: Record<string, Feature> /* 👈 original geojson */;
  parcels: Parcel[] /* 👈 overrdes */;
}

@State<ParcelsStateModel>({
  name: 'parcels',
  defaults: {
    features: {},
    parcels: []
  }
})
@Injectable()
export class ParcelsState implements NgxsOnInit {
  @Select(MapState) map$: Observable<Map>;
  @Select(AuthState.profile) profile$: Observable<Profile>;

  constructor(private firestore: AngularFirestore, private store: Store) {}

  @Selector() static parcels(state: ParcelsStateModel): Parcel[] {
    return state.parcels;
  }

  #handleMap$(): void {
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
                .orderBy('timestamp');
            // TODO 🔥 how do we ever unsubscribe?
            return this.firestore
              .collection<Parcel>('parcels', query)
              .valueChanges();
          }
        })
      )
      .subscribe((parcels: Parcel[]) =>
        this.store.dispatch(new SetParcels(parcels))
      );
  }

  @Action(AddFeature) addFeature(
    ctx: StateContext<ParcelsStateModel>,
    action: AddFeature
  ): void {
    ctx.setState(
      patch({
        features: patch({ [`${action.path}:${action.id}`]: action.feature })
      })
    );
  }

  feature(path: string, id: string): Feature {
    return this.store.snapshot().parcels.features[`${path}:${id}`];
  }

  ngxsOnInit(): void {
    this.#handleMap$();
  }

  @Action(SetParcels) setParcels(
    ctx: StateContext<ParcelsStateModel>,
    action: SetParcels
  ): void {
    ctx.setState(patch({ parcels: action.parcels }));
  }
}
