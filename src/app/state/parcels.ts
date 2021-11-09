import { AuthState } from './auth';
import { Map } from './map';
import { MapState } from './map';
import { Parcel } from '../common';
import { ParcelAction } from '../common';
import { ParcelID } from '../common';
import { Profile } from './auth';

import { calculate } from '../common';
import { deserialize } from '../common';
import { normalize } from '../common';
import { serialize } from '../common';
import { timestamp } from '../common';

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

import copy from 'fast-copy';
import hash from 'object-hash';

export class AddParcels {
  static readonly type = '[Parcels] AddParcels';
  constructor(public parcels: Parcel[]) {}
}

export class CanDo {
  static readonly type = '[Parcels] CanDo';
  constructor(public canUndo: boolean, public canRedo: boolean) {}
}

export class Redo {
  static readonly type = '[Parcels] Redo';
  constructor() {}
}

export class SetParcels {
  static readonly type = '[Parcels] SetParcels';
  constructor(public parcels: Parcel[]) {}
}

export class Undo {
  static readonly type = '[Parcels] Undo';
  constructor() {}
}

export type ParcelsStateModel = Parcel[];

const redoStack: Parcel[] = [];
const undoStack: Parcel[] = [];

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
          if (map === null) {
            redoStack.length = 0;
            undoStack.length = 0;
            return of([]);
          } else {
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
      .subscribe((parcels: Parcel[]) => {
        parcels.forEach((parcel) => deserialize(parcel));
        this.store.dispatch(new SetParcels(parcels));
      });
  }

  #lastActionByParcelID(parcels: Parcel[]): Record<ParcelID, ParcelAction> {
    return parcels
      .filter((parcel) => parcel.action !== 'modified')
      .reduce((acc, parcel) => {
        if (!acc[parcel.id]) acc[parcel.id] = parcel.action;
        return acc;
      }, {});
  }

  #normalize(parcel: Parcel): Parcel {
    calculate(parcel);
    normalize(parcel);
    serialize(parcel);
    timestamp(parcel);
    return parcel;
  }

  @Action(AddParcels) addParcels(
    ctx: StateContext<ParcelsStateModel>,
    action: AddParcels
  ): void {
    const batch = this.firestore.firestore.batch();
    redoStack.length = 0;
    undoStack.length = 0;
    const promises = action.parcels.map((parcel) => {
      return this.#parcels
        .add(this.#normalize(parcel))
        .then((ref) => undoStack.push({ ...copy(parcel), $id: ref.id }));
    });
    // TODO 🔥 we have a great opportunity here to "cull"
    //         extraneous parcels
    batch.commit();
    Promise.all(promises).then(() => {
      ctx.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    });
    // 👉 side-effect of handleStreams$ will update state
  }

  @Action(CanDo) canDo(
    _ctx: StateContext<ParcelsStateModel>,
    _action: CanDo
  ): void {
    /* placeholder */
  }

  ngxsOnInit(): void {
    this.#handleStreams$();
  }

  parcelsAdded(parcels: Parcel[]): Set<ParcelID> {
    const hash = this.#lastActionByParcelID(parcels);
    return new Set(Object.keys(hash).filter((id) => hash[id] === 'added'));
  }

  // 👉 consider the entire stream of parcels, in reverse timestamp order
  //    separate them by ID
  //    once a "removed" action found, ignore prior modifications
  parcelsModified(parcels: Parcel[]): Record<ParcelID, Parcel[]> {
    const removedIDs = new Set<ParcelID>();
    return parcels.reduce((acc, parcel) => {
      if (parcel.action === 'removed') removedIDs.add(parcel.id);
      if (!removedIDs.has(parcel.id)) {
        if (!acc[parcel.id]) acc[parcel.id] = [];
        acc[parcel.id].push(parcel);
      }
      return acc;
    }, {});
  }

  parcelsRemoved(parcels: Parcel[]): Set<ParcelID> {
    const hash = this.#lastActionByParcelID(parcels);
    return new Set(Object.keys(hash).filter((id) => hash[id] === 'removed'));
  }

  @Action(Redo) redo(
    ctx: StateContext<ParcelsStateModel>,
    _action: Redo
  ): void {
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch(new CanDo(false, false));
    // 👉 clear the undo stack
    undoStack.length = 0;
    // 👉 process all the parcels in the redo stack
    const batch = this.firestore.firestore.batch();
    const promises = redoStack.map((parcel) => {
      switch (parcel.action) {
        case 'added':
          delete parcel.$id;
          parcel.action = 'removed';
          return this.#parcels.add(parcel).then(() => undoStack.push(parcel));
        case 'modified':
          delete parcel.$id;
          return this.#parcels
            .add(parcel)
            .then((ref) => undoStack.push({ ...copy(parcel), $id: ref.id }));
        case 'removed':
          delete parcel.$id;
          parcel.action = 'added';
          return this.#parcels.add(parcel).then(() => undoStack.push(parcel));
      }
    });
    redoStack.length = 0;
    batch.commit();
    Promise.all(promises).then(() => {
      ctx.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    });
    // 👉 side-effect of handleStreams$ will update state
  }

  @Action(SetParcels) setParcels(
    ctx: StateContext<ParcelsStateModel>,
    action: SetParcels
  ): void {
    ctx.setState(action.parcels);
  }

  @Action(Undo) undo(
    ctx: StateContext<ParcelsStateModel>,
    _action: Undo
  ): void {
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch(new CanDo(false, false));
    // 👉 clear the redo stack
    redoStack.length = 0;
    // 👉 process all the parcels in the undo stack
    const batch = this.firestore.firestore.batch();
    const promises = undoStack.map((parcel) => {
      switch (parcel.action) {
        case 'added':
          delete parcel.$id;
          parcel.action = 'removed';
          return this.#parcels.add(parcel).then(() => redoStack.push(parcel));
        case 'modified':
          return this.#parcels
            .doc(parcel.$id)
            .delete()
            .then(() => redoStack.push(parcel));
        case 'removed':
          delete parcel.$id;
          parcel.action = 'added';
          return this.#parcels.add(parcel).then(() => redoStack.push(parcel));
      }
    });
    undoStack.length = 0;
    batch.commit();
    Promise.all(promises).then(() => {
      ctx.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    });
    // 👉 side-effect of handleStreams$ will update state
  }
}
