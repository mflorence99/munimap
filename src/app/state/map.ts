import { Injectable } from '@angular/core';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';

export interface MapStateModel {
  currentPath: Path;
  viewByPath: Record<Path, View>;
}

export type Path = string;

export interface View {
  center: [number, number];
  path: Path;
  zoom: number;
}

@State<MapStateModel>({
  name: 'map',
  defaults: {
    currentPath: '',
    viewByPath: {}
  }
})
@Injectable()
export class MapState {
  static splitPath(path: Path): string[] {
    return path.split(':');
  }

  @Selector() static view(state: MapStateModel): View {
    return state.viewByPath[state.currentPath];
  }
}
