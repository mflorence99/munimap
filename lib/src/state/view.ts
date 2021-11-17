import { theState } from '../geojson';

import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

export class SetGPS {
  static readonly type = '[View] SetGPS';
  constructor(public gps: boolean) {}
}

export class UpdateView {
  static readonly type = '[View] UpdateView';
  constructor(public path: Path, public view: View) {}
}

export type Path = string;

export interface View {
  center: number[];
  zoom: number;
}

export interface ViewStateModel {
  gps: boolean;
  recentPath: string;
  viewByPath: Record<Path, View>;
}

@State<ViewStateModel>({
  name: 'view',
  defaults: {
    gps: false,
    recentPath: null,
    viewByPath: {
      [theState]: { center: null, zoom: null }
    }
  }
})
@Injectable()
export class ViewState {
  constructor(private store: Store) {}

  @Selector() static gps(state: ViewStateModel): boolean {
    return state.gps;
  }

  recentPath(): string {
    return this.store.snapshot().view.recentPath;
  }

  @Action(SetGPS) setGPS(
    ctx: StateContext<ViewStateModel>,
    action: SetGPS
  ): void {
    ctx.setState(patch({ gps: action.gps }));
  }

  @Action(UpdateView) updateView(
    ctx: StateContext<ViewStateModel>,
    action: UpdateView
  ): void {
    const path = action.path;
    const view = action.view;
    ctx.setState(
      patch({ recentPath: path, viewByPath: patch({ [path]: view }) })
    );
  }
}
