import { theState } from '../geojson';

import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

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
  viewByPath: Record<Path, View>;
}

@State<ViewStateModel>({
  name: 'view',
  defaults: {
    viewByPath: {
      [theState]: { center: null, zoom: null }
    }
  }
})
@Injectable()
export class ViewState {
  @Action(UpdateView) updateView(
    ctx: StateContext<ViewStateModel>,
    action: UpdateView
  ): void {
    const path = action.path;
    const view = action.view;
    ctx.setState(patch({ viewByPath: patch({ [path]: view }) }));
  }
}
