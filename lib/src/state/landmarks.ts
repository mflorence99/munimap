import { AnonState } from './anon';
import { AuthState } from './auth';
import { CanDo } from './undo';
import { ClearStacks as ClearStacksProxy } from './undo';
import { Landmark } from '../common';
import { LandmarkID } from '../common';
import { Landmarks } from '../common';
import { Map } from './map';
import { MapState } from './map';
import { Profile } from './auth';
import { Redo as RedoProxy } from './undo';
import { Undo as UndoProxy } from './undo';
import { Working } from './working';

import { calculateLandmark } from '../common';
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
import { featureCollection } from '@turf/helpers';
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

class Undoable {
  redoneBy: typeof Undoable;
  undoneBy: typeof Undoable;
  constructor(
    public landmark: Partial<Landmark>,
    public undoable: boolean
  ) {}
}

export class AddLandmark extends Undoable {
  static readonly type = '[Landmarks] AddLandmark';
  constructor(
    public landmark: Partial<Landmark>,
    public undoable = true
  ) {
    super(landmark, undoable);
    this.redoneBy = AddLandmark;
    this.undoneBy = DeleteLandmark;
  }
}

export class ClearStacks {
  static readonly type = '[Landmarks] ClearStacks';
  constructor() {}
}

export class DeleteLandmark extends Undoable {
  static readonly type = '[Landmarks] DeleteLandmark';
  constructor(
    public landmark: Partial<Landmark>,
    public undoable = true
  ) {
    super(landmark, undoable);
    this.redoneBy = DeleteLandmark;
    this.undoneBy = AddLandmark;
  }
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

export class UpdateLandmark extends Undoable {
  static readonly type = '[Landmarks] UpdateLandmark';
  constructor(
    public landmark: Partial<Landmark>,
    public undoable = true
  ) {
    super(landmark, undoable);
    this.redoneBy = UpdateLandmark;
    this.undoneBy = UpdateLandmark;
  }
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

  @Action(AddLandmark) addLandmark(
    ctx: StateContext<LandmarksStateModel>,
    action: AddLandmark
  ): Promise<void> {
    const normalized = this.#normalize(action.landmark);
    if (!normalized.id) normalized.id = makeLandmarkID(normalized);
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch([new CanDo(false, false), new Working(+1)]);
    // 👇 add the landmark
    console.log(
      `%cFirestore add: landmarks ${normalized.id} ${JSON.stringify(
        normalized
      )}`,
      'color: crimson'
    );
    const undoAction = this.#makeUndoAction(ctx, action, normalized.id);
    const docRef = doc(this.firestore, 'landmarks', normalized.id);
    return setDoc(docRef, normalized).then(() => {
      if (undoAction) undoStack.push(undoAction);
      ctx.dispatch([
        new CanDo(undoStack.length > 0, redoStack.length > 0),
        new Working(-1)
      ]);
    });
    // 👉 side-effect of handleStreams$ will update state
  }

  @Action(DeleteLandmark) deleteLandmark(
    ctx: StateContext<LandmarksStateModel>,
    action: DeleteLandmark
  ): Promise<void> {
    // 👇 don't really need to normalize as only an ID is needed
    //    just following the pattern
    const normalized = this.#normalize(action.landmark);
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch([new CanDo(false, false), new Working(+1)]);
    // 👇 delete the landmark
    console.log(
      `%cFirestore delete: landmarks ${normalized.id}`,
      'color: crimson'
    );
    const undoAction = this.#makeUndoAction(ctx, action, normalized.id);
    const docRef = doc(this.firestore, 'landmarks', normalized.id);
    return deleteDoc(docRef).then(() => {
      if (undoAction) undoStack.push(undoAction);
      ctx.dispatch([
        new CanDo(undoStack.length > 0, redoStack.length > 0),
        new Working(-1)
      ]);
    });
    // 👉 side-effect of handleStreams$ will update state
  }

  @Action(Redo) redo(
    ctx: StateContext<LandmarksStateModel>,
    _action: Redo
  ): void {
    // 👉 quick return if nothing to redo
    if (redoStack.length === 0) return;
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch([new CanDo(false, false), new Working(+1)]);
    // 👉 prepare the undo/redo actions
    const redoAction = redoStack.pop();
    const undoAction = new redoAction.redoneBy(
      this.#landmarkByID(ctx, redoAction.landmark.id),
      /* undoable = */ false
    );
    // 👇 execute the redo action
    ctx.dispatch(redoAction).subscribe(() => {
      undoStack.push(undoAction);
      ctx.dispatch([
        new CanDo(undoStack.length > 0, redoStack.length > 0),
        new Working(-1)
      ]);
    });
  }

  @Action(SetLandmarks) setLandmarks(
    ctx: StateContext<LandmarksStateModel>,
    action: SetLandmarks
  ): void {
    // this.#logLandmarks(action.landmarks);
    ctx.setState(action.landmarks);
  }

  @Action(Undo) undo(
    ctx: StateContext<LandmarksStateModel>,
    _action: Undo
  ): void {
    // 👉 quick return if nothing to undo
    if (undoStack.length === 0) return;
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch([new CanDo(false, false), new Working(+1)]);
    // 👉 prepare the undo/redo actions
    const undoAction = undoStack.pop();
    const redoAction = new undoAction.redoneBy(
      this.#landmarkByID(ctx, undoAction.landmark.id),
      /* undoable = */ false
    );
    // 👇 execute the undo action
    ctx.dispatch(undoAction).subscribe(() => {
      redoStack.push(redoAction);
      ctx.dispatch([
        new CanDo(undoStack.length > 0, redoStack.length > 0),
        new Working(-1)
      ]);
    });
  }

  @Action(UpdateLandmark) updateLandmark(
    ctx: StateContext<LandmarksStateModel>,
    action: UpdateLandmark
  ): Promise<void> {
    const normalized = this.#normalize(action.landmark);
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch([new CanDo(false, false), new Working(+1)]);
    // 👉 update the landmark
    console.log(
      `%cFirestore set: landmarks ${normalized.id} ${JSON.stringify(
        normalized
      )}`,
      'color: chocolate'
    );
    const undoAction = this.#makeUndoAction(ctx, action, normalized.id);
    const docRef = doc(this.firestore, 'landmarks', normalized.id);
    return setDoc(docRef, normalized, { merge: true }).then(() => {
      if (undoAction) undoStack.push(undoAction);
      ctx.dispatch([
        new CanDo(undoStack.length > 0, redoStack.length > 0),
        new Working(-1)
      ]);
    });
    // 👉 side-effect of handleStreams$ will update state
  }

  ngxsOnInit(): void {
    this.#handleActions$();
    this.#handleStreams$();
  }

  toGeoJSON(): Landmarks {
    return featureCollection(this.store.snapshot().landmarks);
  }

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
        distinctUntilChanged(
          (p: any, q: any): boolean => hash.MD5(p) === hash.MD5(q)
        )
      )
      .subscribe((landmarks: Landmark[]) => {
        this.store.dispatch(new SetLandmarks(landmarks));
      });
  }

  #landmarkByID(
    ctx: StateContext<LandmarksStateModel>,
    id: string
  ): Partial<Landmark> {
    const original = ctx.getState().find((landmark) => landmark.id === id);
    return original ? copy(original) : { id };
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

  #makeUndoAction(
    ctx: StateContext<LandmarksStateModel>,
    origAction: Undoable,
    id: LandmarkID
  ): Undoable {
    let undoAction;
    if (origAction.undoable) {
      redoStack.length = 0;
      while (undoStack.length >= maxStackSize) undoStack.shift();
      // 👉 push the undo action onto the undo stack
      undoAction = new origAction.undoneBy(
        this.#landmarkByID(ctx, id),
        /* undoable = */ false
      );
    }
    return undoAction;
  }

  #normalize(landmark: Partial<Landmark>): Partial<Landmark> {
    const normalized = copy(landmark);
    calculateLandmark(normalized);
    serializeLandmark(normalized);
    return normalized;
  }
}
