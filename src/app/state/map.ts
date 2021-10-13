import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

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
      [theState]: {
        center: null,
        path: theState,
        zoom: null
      }
    }
  }
})
@Injectable()
export class MapState {
  static defaultZoom(path: Path): number {
    const parts = MapState.splitPath(path);
    const defaults = [10, 11, 13];
    return defaults[parts.length - 1];
  }

  static splitPath(path: Path): string[] {
    return path.split(':');
  }

  @Selector() static view(state: MapStateModel): View {
    return state.viewByPath[state.currentPath];
  }

  @Action(UpdateView) updateView(
    ctx: StateContext<MapStateModel>,
    action: UpdateView
  ): void {
    const view = action.view;
    ctx.setState(patch({ viewByPath: patch({ [view.path]: view }) }));
  }
}
