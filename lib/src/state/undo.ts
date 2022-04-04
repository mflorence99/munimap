import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

// 🔥 this isn't a real state
//    instead, it acts as a proxy for the real states that are
//    listening for actions and acting accordingly

export class CanDo {
  static readonly type = '[Undo] CanDo';
  constructor(public canUndo: boolean, public canRedo: boolean) {}
}

export class ClearStacks {
  static readonly type = '[Undo] ClearStacks';
  constructor() {}
}

export class Redo {
  static readonly type = '[Undo] Redo';
  constructor() {}
}

export class Undo {
  static readonly type = '[Undo] Undo';
  constructor() {}
}

export type UndoStateModel = any;

@State<UndoStateModel>({
  name: 'undo',
  defaults: {}
})
@Injectable()
export class UndoState {}
