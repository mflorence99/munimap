import { AuthState } from './auth';
import { Map } from './map';
import { MapState } from './map';
import { Parcel } from '../common';
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
const undoStack: string[] = [];

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
        .then((ref) => undoStack.push(ref.id));
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

  @Action(Redo) redo(
    ctx: StateContext<ParcelsStateModel>,
    _action: Redo
  ): void {
    // 👉 marshall the undo stack
    undoStack.length = 0;
    redoStack.forEach((parcel) => undoStack.push(parcel.$id));
    // 👉 add all the parcels in the redo stack
    const batch = this.firestore.firestore.batch();
    redoStack.map((parcel) => {
      return this.#parcels
        .doc(parcel.$id)
        .set(this.#normalize(parcel))
        .then(() => undoStack.push(parcel.$id));
    });
    redoStack.length = 0;
    batch.commit();
    // Promise.all(promises).then(() => {
    ctx.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    // });
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
    const parcels = ctx.getState();
    // 👉 marshall the redo stack
    redoStack.length = 0;
    parcels.forEach((parcel) => {
      if (undoStack.includes(parcel.$id)) redoStack.push(copy(parcel));
    });
    // 👉 delete all the parcels in the undo stack
    const batch = this.firestore.firestore.batch();
    undoStack.map((id) => {
      return this.#parcels.doc(id).delete();
    });
    undoStack.length = 0;
    batch.commit();
    // Promise.all(promises).then(() => {
    ctx.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    // });
    // 👉 side-effect of handleStreams$ will update state
  }
}
