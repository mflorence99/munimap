import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

export class PopCurrentPath {
  static readonly type = '[Map] PopCurrentPath';
  constructor() {}
}

export class PushCurrentPath {
  static readonly type = '[Map] PushCurrentPath';
  constructor(public part: string) {}
}

export class SetCurrentPath {
  static readonly type = '[Map] SetCurrentPath';
  constructor(public currentPath: string) {}
}

export class UpdateView {
  static readonly type = '[Map] UpdateView';
  constructor(public view: View) {}
}

export interface MapStateModel {
  currentPath: Path;
  viewByPath: Record<Path, View>;
}

export type Path = string;

export interface View {
  center: number[];
  path: Path;
  zoom: number;
}

const theState = 'NEW HAMPSHIRE';

@State<MapStateModel>({
  name: 'map',
  defaults: {
    currentPath: theState,
    viewByPath: {
      [theState]: MapState.defaultView(theState)
    }
  }
})
@Injectable()
export class MapState {
  static defaultView(path: Path): View {
    return {
      center: null,
      path: path,
      zoom: null
    };
  }

  static defaultZoom(path: Path): number {
    const parts = MapState.splitPath(path);
    const defaults = [10, 11, 13];
    return defaults[parts.length - 1];
  }

  static joinPath(parts: string[]): Path {
    return parts.join(':');
  }

  static splitPath(path: Path): string[] {
    return path.split(':');
  }

  @Selector() static view(state: MapStateModel): View {
    return (
      state.viewByPath[state.currentPath] ??
      MapState.defaultView(state.currentPath)
    );
  }

  @Action(PopCurrentPath) popCurrentPath(
    ctx: StateContext<MapStateModel>,
    _action: PopCurrentPath
  ): void {
    const state = ctx.getState();
    const parts = MapState.splitPath(state.currentPath);
    if (parts.length > 0) {
      parts.pop();
      const currentPath = MapState.joinPath(parts);
      ctx.setState(patch({ currentPath }));
    }
  }

  @Action(PushCurrentPath) pushCurrentPath(
    ctx: StateContext<MapStateModel>,
    action: PushCurrentPath
  ): void {
    const state = ctx.getState();
    const parts = MapState.splitPath(state.currentPath);
    if (parts.length < 3) {
      const part = action.part;
      parts.push(part);
      const currentPath = MapState.joinPath(parts);
      ctx.setState(patch({ currentPath }));
    }
  }

  @Action(SetCurrentPath) setCurrentPath(
    ctx: StateContext<MapStateModel>,
    action: SetCurrentPath
  ): void {
    const currentPath = action.currentPath;
    ctx.setState(patch({ currentPath }));
  }

  @Action(UpdateView) updateView(
    ctx: StateContext<MapStateModel>,
    action: UpdateView
  ): void {
    const view = action.view;
    ctx.setState(patch({ viewByPath: patch({ [view.path]: view }) }));
  }
}
