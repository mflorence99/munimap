import { ParcelID } from '../common';

import { Action } from '@ngxs/store';
import { Coordinate } from 'ol/coordinate';
import { Firestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { deleteDoc } from '@angular/fire/firestore';
import { doc } from '@angular/fire/firestore';
import { getDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { serverTimestamp } from 'firebase/firestore';
import { setDoc } from '@angular/fire/firestore';

import copy from 'fast-copy';

const ACTION_SCOPE = 'Map';

export namespace MapActions {
  export class ClearMap {
    static readonly type = `[${ACTION_SCOPE}] ClearMap`;
    constructor() {}
  }

  export class CreateMap {
    static readonly type = `[${ACTION_SCOPE}] CreateMap`;
    constructor(public map: Map) {}
  }

  export class CreateMapError {
    static readonly type = `[${ACTION_SCOPE}] CreateMapError`;
    constructor(public error: string) {}
  }

  export class DeleteMap {
    static readonly type = `[${ACTION_SCOPE}] DeleteMap`;
    constructor(public id: string) {}
  }

  export class LoadMap {
    static readonly type = `[${ACTION_SCOPE}] LoadMap`;
    constructor(
      public id: string,
      public dflt: Map,
      public touch = false
    ) {}
  }

  export class SetMap {
    static readonly type = `[${ACTION_SCOPE}] SetMap`;
    constructor(public map: Map) {}
  }

  export class UpdateMap {
    static readonly type = `[${ACTION_SCOPE}] UpdateMap`;
    constructor(
      public map: Map,
      public refresh = false
    ) {}
  }

  export class UpdateMapError {
    static readonly type = `[${ACTION_SCOPE}] UpdateMapError`;
    constructor(public error: string) {}
  }
}

export type MapType = 'apdvd' | 'area' | 'dpw' | 'parcels' | 'property';

export interface Map {
  bbox?: Coordinate;
  contours2ft?: boolean;
  id: string;
  isDflt?: boolean;
  name: string;
  owner: string;
  parcelIDs?: ParcelID[];
  path: string;
  printSize: number[];
  timestamp?: any /* 👈 optional only because we'll complete it */;
  type: MapType;
}

export type MapStateModel = Map;

@State<MapStateModel>({
  name: 'map',
  defaults: null
})
@Injectable()
export class MapState {
  #firestore = inject(Firestore);
  #store = inject(Store);

  @Selector() static map(state: MapStateModel): Map {
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  @Action(MapActions.ClearMap) clearMap(
    ctx: StateContext<MapStateModel>,
    _action: MapActions.ClearMap
  ): void {
    ctx.setState(null);
  }

  @Action(MapActions.CreateMap) createMap(
    ctx: StateContext<MapStateModel>,
    action: MapActions.CreateMap
  ): void {
    console.log(`%cFirestore get: maps ${action.map.id}`, 'color: goldenrod');
    const docRef = doc(this.#firestore, 'maps', action.map.id);
    getDoc(docRef).then((doc) => {
      if (doc.exists()) {
        const message = `Map ID "${action.map.id}" is already in use.  Please choose another.`;
        ctx.dispatch(new MapActions.CreateMapError(message));
      } else {
        setDoc(
          docRef,
          { ...action.map, isDflt: false, timestamp: serverTimestamp() },
          { merge: true }
        );
      }
    });
  }

  @Action(MapActions.DeleteMap) deleteMap(
    ctx: StateContext<MapStateModel>,
    action: MapActions.DeleteMap
  ): void {
    ctx.dispatch(new MapActions.ClearMap());
    console.log(`%cFirestore delete: maps ${action.id}`, 'color: crimson');
    const docRef = doc(this.#firestore, 'maps', action.id);
    deleteDoc(docRef);
  }

  @Action(MapActions.LoadMap) loadMap(
    ctx: StateContext<MapStateModel>,
    action: MapActions.LoadMap
  ): void {
    // 👇 there's no map until there is one
    //    we can't use the old one!
    ctx.dispatch(new MapActions.ClearMap());
    console.log(`%cFirestore get: maps ${action.id}`, 'color: goldenrod');
    const docRef = doc(this.#firestore, 'maps', action.id);
    getDoc(docRef).then((doc) => {
      const map = doc.exists()
        ? (doc.data() as Map)
        : { ...action.dflt, isDflt: true };
      ctx.dispatch(new MapActions.SetMap(map));
      // 👇 update the last-used timestamp, if this isn't the default map
      if (!map.isDflt && action.touch) {
        setDoc(
          docRef,
          { ...map, timestamp: serverTimestamp() },
          { merge: true }
        );
      }
    });
  }

  @Action(MapActions.SetMap) setMap(
    ctx: StateContext<MapStateModel>,
    action: MapActions.SetMap
  ): void {
    ctx.setState(copy(action.map));
  }

  @Action(MapActions.UpdateMap) updateMap(
    ctx: StateContext<MapStateModel>,
    action: MapActions.UpdateMap
  ): void {
    if (action.refresh) ctx.dispatch(new MapActions.ClearMap());
    if (action.map.isDflt) {
      console.log(`%cFirestore get: maps ${action.map.id}`, 'color: goldenrod');
      const docRef = doc(this.#firestore, 'maps', action.map.id);
      getDoc(docRef).then((doc) => {
        if (doc.exists()) {
          const message = `Map ID "${action.map.id}" is already in use.  Please choose another.`;
          ctx.dispatch(new MapActions.UpdateMapError(message));
        } else {
          setDoc(
            docRef,
            { ...action.map, isDflt: false, timestamp: serverTimestamp() },
            { merge: true }
          ).then(() => ctx.dispatch(new MapActions.SetMap(action.map)));
        }
      });
    } else {
      console.log(
        `%cFirestore set: maps ${action.map.id} ${JSON.stringify(action.map)}`,
        'color: chocolate'
      );
      const docRef = doc(this.#firestore, 'maps', action.map.id);
      setDoc(docRef, action.map, { merge: true }).then(() =>
        ctx.dispatch(new MapActions.SetMap(action.map))
      );
    }
  }

  currentMap(): Map {
    return this.#store.selectSnapshot<Map>(MapState.map);
  }
}
