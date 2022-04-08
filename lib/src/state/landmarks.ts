import { AnonState } from './anon';
import { AuthState } from './auth';
import { ClearStacks as ClearStacksProxy } from './undo';
import { Landmark } from '../common';
import { Map } from './map';
import { MapState } from './map';
import { Profile } from './auth';
import { Redo as RedoProxy } from './undo';
import { Undo as UndoProxy } from './undo';

import { deserializeLandmark } from '../common';

import { Action } from '@ngxs/store';
import { Actions } from '@ngxs/store';
import { CollectionReference } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { collection } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { merge } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ofActionSuccessful } from '@ngxs/store';
import { query } from '@angular/fire/firestore';
import { where } from '@angular/fire/firestore';

import hash from 'object-hash';

export class ClearStacks {
  static readonly type = '[Landmarks] ClearStacks';
  constructor() {}
}

export class Redo {
  static readonly type = '[Landmarks] Redo';
  constructor() {}
}

export class SetLandmarks {
  static readonly type = '[Landmarks] SetLandmarks';
  constructor(public landmarks: Landmark[]) {}
}

export class Undo {
  static readonly type = '[Landmarks] Undo';
  constructor() {}
}

export type LandmarksStateModel = Landmark[];

// 👇 each item in the undo/redo stack is landmark state

const redoStack: Landmark[] = [];
const undoStack: Landmark[] = [];

@State<LandmarksStateModel>({
  name: 'landmarks',
  defaults: []
})
@Injectable()
export class LandmarksState implements NgxsOnInit {
  @Select(MapState) map$: Observable<Map>;

  // 👇 remember that that author app uses regular logins,
  //    while the viewer app uses anonymous logins --
  //    we don't care which here
  @Select(AnonState.profile) profile1$: Observable<Profile>;
  @Select(AuthState.profile) profile2$: Observable<Profile>;

  constructor(
    private actions$: Actions,
    private firestore: Firestore,
    private store: Store
  ) {}

  #handleActions$(): void {
    this.actions$
      .pipe(ofActionSuccessful(ClearStacksProxy, RedoProxy, UndoProxy))
      .subscribe((action: ClearStacksProxy | RedoProxy | UndoProxy) => {
        switch (action.constructor.name) {
          case ClearStacksProxy.name:
            this.store.dispatch(new ClearStacks());
            break;
          case RedoProxy.name:
            this.store.dispatch(new Redo());
            break;
          case UndoProxy.name:
            this.store.dispatch(new Undo());
            break;
        }
      });
  }

  #handleStreams$(): void {
    const either$ = merge(this.profile1$, this.profile2$);
    combineLatest([this.map$, either$])
      .pipe(
        mergeMap(([map, profile]) => {
          if (map == null || profile == null) {
            redoStack.length = 0;
            undoStack.length = 0;
            return of([]);
          } else {
            const workgroup = AuthState.workgroup(profile);
            console.log(
              `%cFirestore query: landmarks where owner in ${JSON.stringify(
                workgroup
              )} and path == "${map.path}"`,
              'color: goldenrod'
            );
            return collectionData<Landmark>(
              query(
                collection(
                  this.firestore,
                  'landmarks'
                ) as CollectionReference<Landmark>,
                where('owner', 'in', workgroup),
                where('path', '==', map.path)
              ),
              { idField: '$id' }
            );
          }
        }),
        map((landmarks: Landmark[]) => {
          landmarks.forEach((landmark) => deserializeLandmark(landmark));
          return landmarks;
        }),
        // 👉 cut down on noise
        distinctUntilChanged((p, q): boolean => hash.MD5(p) === hash.MD5(q))
      )
      .subscribe((landmarks: Landmark[]) => {
        this.store.dispatch(new SetLandmarks(landmarks));
      });
  }

  #logLandmarks(landmarks: Landmark[]): void {
    console.table(
      landmarks.map((landmark) => {
        return {
          id: landmark.$id,
          geometry: landmark.geometry?.type,
          name: landmark.properties?.name
        };
      })
    );
  }

  ngxsOnInit(): void {
    this.#handleActions$();
    this.#handleStreams$();
  }

  @Action(SetLandmarks) setLandmarks(
    ctx: StateContext<LandmarksStateModel>,
    action: SetLandmarks
  ): void {
    this.#logLandmarks(action.landmarks);
    ctx.setState(action.landmarks);
  }
}
