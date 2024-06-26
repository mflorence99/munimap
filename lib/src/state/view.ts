import { theState } from '../common';

import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { inject } from '@angular/core';
import { patch } from '@ngxs/store/operators';

export type ParcelCoding =
  | 'conformity'
  | 'history'
  | 'ownership'
  | 'topography'
  | 'usage';

export type Path = string;

export class SetGPS {
  static readonly type = '[View] SetGPS';
  constructor(public gps: boolean) {}
}

export class SetHistoricalMapLeft {
  static readonly type = '[View] SetHistoricalMapLeft';
  constructor(public historicalMapLeft: string) {}
}

export class SetHistoricalMapRight {
  static readonly type = '[View] SetHistoricalMapRight';
  constructor(public historicalMapRight: string) {}
}

export class SetParcelCoding {
  static readonly type = '[View] SetParcelCoding';
  constructor(public parcelCoding: ParcelCoding) {}
}

export class SetSatelliteView {
  static readonly type = '[View] SetSatelliteView';
  constructor(public satelliteView: boolean) {}
}

export class SetSatelliteYear {
  static readonly type = '[View] SetSatelliteYear';
  constructor(public satelliteYear: string) {}
}

export class SetSideBySideView {
  static readonly type = '[View] SetSideBySideView';
  constructor(public sideBySideView: boolean) {}
}

export class SetStreetFilter {
  static readonly type = '[View] SetStreetFilter';
  constructor(public streetFilter: string) {}
}

export class UpdateView {
  static readonly type = '[View] UpdateView';
  constructor(
    public path: Path,
    public view: View
  ) {}
}

export interface View {
  center: number[];
  zoom: number;
}

export interface ViewStateModel {
  gps: boolean;
  historicalMapLeft: string;
  historicalMapRight: string;
  parcelCoding: ParcelCoding;
  recentPath: string;
  satelliteView: boolean;
  satelliteYear: string;
  sideBySideView: boolean;
  streetFilter: string;
  viewByPath: Record<Path, View>;
}

@State<ViewStateModel>({
  name: 'view',
  defaults: {
    gps: false,
    historicalMapLeft: '',
    historicalMapRight: '',
    parcelCoding: 'usage',
    recentPath: null,
    satelliteView: false,
    satelliteYear: '',
    sideBySideView: false,
    streetFilter: '',
    viewByPath: {
      [theState]: { center: null, zoom: null }
    }
  }
})
@Injectable()
export class ViewState {
  #store = inject(Store);

  @Selector() static gps(state: ViewStateModel): boolean {
    return state.gps;
  }

  @Selector() static historicalMapLeft(state: ViewStateModel): string {
    return (
      state.historicalMapLeft ||
      '' /* 👈 b/c historicalMapLeft was added later */
    );
  }

  @Selector() static historicalMapRight(state: ViewStateModel): string {
    return (
      state.historicalMapRight ||
      '' /* 👈 b/c historicalMapRight was added later */
    );
  }

  @Selector() static parcelCoding(state: ViewStateModel): ParcelCoding {
    return (
      state.parcelCoding || 'usage' /* 👈 b/c parcelCoding was added later */
    );
  }

  @Selector() static satelliteView(state: ViewStateModel): boolean {
    return state.satelliteView;
  }

  @Selector() static satelliteYear(state: ViewStateModel): string {
    return state.satelliteYear || '' /* 👈 b/c satelliteYear was added later */;
  }

  @Selector() static sideBySideView(state: ViewStateModel): boolean {
    return state.sideBySideView;
  }

  @Selector() static streetFilter(state: ViewStateModel): string {
    return state.streetFilter || '' /* 👈 b/c streetFilter was added later */;
  }

  @Selector() static view(state: ViewStateModel): ViewStateModel {
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  @Action(SetGPS) setGPS(
    ctx: StateContext<ViewStateModel>,
    action: SetGPS
  ): void {
    ctx.setState(patch({ gps: action.gps }));
  }

  @Action(SetHistoricalMapLeft) setHistoricalMapLeft(
    ctx: StateContext<ViewStateModel>,
    action: SetHistoricalMapLeft
  ): void {
    ctx.setState(patch({ historicalMapLeft: action.historicalMapLeft }));
  }

  @Action(SetHistoricalMapRight) setHistoricalMapRight(
    ctx: StateContext<ViewStateModel>,
    action: SetHistoricalMapRight
  ): void {
    ctx.setState(patch({ historicalMapRight: action.historicalMapRight }));
  }

  @Action(SetParcelCoding) setParcelCoding(
    ctx: StateContext<ViewStateModel>,
    action: SetParcelCoding
  ): void {
    ctx.setState(patch({ parcelCoding: action.parcelCoding }));
  }

  @Action(SetSatelliteView) setSatelliteView(
    ctx: StateContext<ViewStateModel>,
    action: SetSatelliteView
  ): void {
    ctx.setState(patch({ satelliteView: action.satelliteView }));
  }

  @Action(SetSatelliteYear) setSatelliteYear(
    ctx: StateContext<ViewStateModel>,
    action: SetSatelliteYear
  ): void {
    ctx.setState(patch({ satelliteYear: action.satelliteYear }));
  }

  @Action(SetSideBySideView) setSideBySideView(
    ctx: StateContext<ViewStateModel>,
    action: SetSideBySideView
  ): void {
    ctx.setState(patch({ sideBySideView: action.sideBySideView }));
  }

  @Action(SetStreetFilter) setStreetFilter(
    ctx: StateContext<ViewStateModel>,
    action: SetStreetFilter
  ): void {
    ctx.setState(patch({ streetFilter: action.streetFilter }));
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

  recentPath(): string {
    return this.#store.selectSnapshot(ViewState.view).recentPath;
  }
}
