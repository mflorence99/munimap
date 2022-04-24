import { AnonState } from './anon';
import { AuthState } from './auth';
import { CanDo } from './undo';
import { ClearStacks as ClearStacksProxy } from './undo';
import { Landmark } from '../common';
import { Map } from './map';
import { MapState } from './map';
import { Profile } from './auth';
import { Redo as RedoProxy } from './undo';
import { Undo as UndoProxy } from './undo';

import { deserializeLandmark } from '../common';
import { makeLandmarkID } from '../common';
import { serializeLandmark } from '../common';

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
import { deleteDoc } from '@angular/fire/firestore';
import { distinctUntilChanged } from 'rxjs/operators';
import { doc } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { merge } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ofActionSuccessful } from '@ngxs/store';
import { query } from '@angular/fire/firestore';
import { setDoc } from '@angular/fire/firestore';
import { where } from '@angular/fire/firestore';

import copy from 'fast-copy';
import hash from 'object-hash';

export class AddLandmark {
  static readonly type = '[Landmarks] AddLandmark';
  constructor(public landmark: Partial<Landmark>, public undoable = true) {}
}

export class ClearStacks {
  static readonly type = '[Landmarks] ClearStacks';
  constructor() {}
}

export class DeleteLandmark {
  static readonly type = '[Landmarks] DeleteLandmark';
  constructor(public landmark: Partial<Landmark>, public undoable = true) {}
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

export class UpdateLandmark {
  static readonly type = '[Landmarks] UpdateLandmark';
  constructor(public landmark: Partial<Landmark>, public undoable = true) {}
}

type RedoableAction = UpdateLandmark;
type UndoableAction = RedoableAction;

export type LandmarksStateModel = Landmark[];

// 👇 each item in the undo/redo stack is landmark state

const maxStackSize = 7;
const redoStack: RedoableAction[] = [];
const undoStack: UndoableAction[] = [];

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
        if (action instanceof ClearStacksProxy)
          this.store.dispatch(new ClearStacks());
        else if (action instanceof RedoProxy) this.store.dispatch(new Redo());
        else if (action instanceof UndoProxy) this.store.dispatch(new Undo());
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

  #landmarkByID(ctx: StateContext<LandmarksStateModel>, id: string): Landmark {
    return copy(ctx.getState().find((landmark) => landmark.id === id));
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

  #normalize(landmark: Partial<Landmark>): Partial<Landmark> {
    const normalized = copy(landmark);
    serializeLandmark(normalized);
    return normalized;
  }

  @Action(AddLandmark) addLandmark(
    ctx: StateContext<LandmarksStateModel>,
    action: AddLandmark
  ): void {
    const normalized = this.#normalize(action.landmark);
    if (!normalized.id) normalized.id = makeLandmarkID(normalized);
    console.log(
      `%cFirestore add: landmarks ${normalized.id} ${JSON.stringify(
        normalized
      )}`,
      'color: crimson'
    );
    const docRef = doc(this.firestore, 'landmarks', action.landmark.id);
    setDoc(docRef, normalized);
  }

  @Action(DeleteLandmark) deleteLandmark(
    ctx: StateContext<LandmarksStateModel>,
    action: DeleteLandmark
  ): void {
    console.log(
      `%cFirestore delete: landmarks ${action.landmark.id}`,
      'color: crimson'
    );
    const docRef = doc(this.firestore, 'landmarks', action.landmark.id);
    deleteDoc(docRef);
  }

  ngxsOnInit(): void {
    this.#handleActions$();
    this.#handleStreams$();
  }

  @Action(Redo) redo(
    ctx: StateContext<LandmarksStateModel>,
    _action: Redo
  ): void {
    // 👉 quick return if nothing to redo
    if (redoStack.length === 0) return;
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch(new CanDo(false, false));
    // 👉 prepare the undo/redo actions
    const redoAction = redoStack.pop();
    const undoAction = new UpdateLandmark(
      this.#landmarkByID(ctx, redoAction.landmark.id),
      /* undoable = */ false
    );
    // 👇 execute the redo action
    ctx.dispatch(redoAction).subscribe(() => {
      undoStack.push(undoAction);
      ctx.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    });
  }

  @Action(SetLandmarks) setLandmarks(
    ctx: StateContext<LandmarksStateModel>,
    action: SetLandmarks
  ): void {
    this.#logLandmarks(action.landmarks);
    ctx.setState(action.landmarks);
  }

  @Action(Undo) undo(
    ctx: StateContext<LandmarksStateModel>,
    _action: Undo
  ): void {
    // 👉 quick return if nothing to undo
    if (undoStack.length === 0) return;
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch(new CanDo(false, false));
    // 👉 prepare the undo/redo actions
    const undoAction = undoStack.pop();
    const redoAction = new UpdateLandmark(
      this.#landmarkByID(ctx, undoAction.landmark.id),
      /* undoable = */ false
    );
    // 👇 execute the undo action
    ctx.dispatch(undoAction).subscribe(() => {
      redoStack.push(redoAction);
      ctx.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    });
  }

  @Action(UpdateLandmark) updateLandmark(
    ctx: StateContext<LandmarksStateModel>,
    action: UpdateLandmark
  ): Promise<void> {
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch(new CanDo(false, false));
    // 👉 reset the stacks as required
    let undoAction;
    if (action.undoable) {
      redoStack.length = 0;
      while (undoStack.length >= maxStackSize) undoStack.shift();
      // 👉 push the undo action onto the undo stack
      undoAction = new UpdateLandmark(
        this.#landmarkByID(ctx, action.landmark.id),
        /* undoable = */ false
      );
    }
    // 👉 update the landmark
    const normalized = this.#normalize(action.landmark);
    console.log(
      `%cFirestore set: landmarks ${normalized.id} ${JSON.stringify(
        normalized
      )}`,
      'color: chocolate'
    );
    const docRef = doc(this.firestore, 'landmarks', normalized.id);
    return setDoc(docRef, normalized, { merge: true }).then(() => {
      if (undoAction) undoStack.push(undoAction);
      ctx.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    });
    // 👉 side-effect of handleStreams$ will update state
  }
}
