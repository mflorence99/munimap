import { ParcelID } from '../common';

import { Action } from '@ngxs/store';
import { Coordinate } from 'ol/coordinate';
import { Firestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { deleteDoc } from '@angular/fire/firestore';
import { doc } from '@angular/fire/firestore';
import { getDoc } from '@angular/fire/firestore';
import { setDoc } from '@angular/fire/firestore';

import copy from 'fast-copy';

export class ClearMap {
  static readonly type = '[Map] ClearMap';
  constructor() {}
}

export class CreateMap {
  static readonly type = '[Map] CreateMap';
  constructor(public map: Map) {}
}

export class CreateMapError {
  static readonly type = '[Map] CreateMapError';
  constructor(public error: string) {}
}

export class DeleteMap {
  static readonly type = '[Map] DeleteMap';
  constructor(public id: string) {}
}

export class LoadMap {
  static readonly type = '[Map] LoadMap';
  constructor(public id: string, public dflt: Map) {}
}

export class SetMap {
  static readonly type = '[Map] SetMap';
  constructor(public map: Map) {}
}

export class UpdateMap {
  static readonly type = '[Map] UpdateMap';
  constructor(public map: Map, public refresh = false) {}
}

export class UpdateMapError {
  static readonly type = '[Map] UpdateMapError';
  constructor(public error: string) {}
}

export type MapType = 'parcels' | 'topo' | 'streets' | 'property';

export interface Map {
  bbox?: Coordinate;
  id: string;
  isDflt?: boolean;
  name: string;
  owner: string;
  parcelIDs?: ParcelID[];
  path: string;
  printSize: number[];
  type: MapType;
}

export type MapStateModel = Map;

@State<MapStateModel>({
  name: 'map',
  defaults: null
})
@Injectable()
export class MapState {
  constructor(private firestore: Firestore, private store: Store) {}

  @Action(ClearMap) clearMap(
    ctx: StateContext<MapStateModel>,
    _action: ClearMap
  ): void {
    ctx.setState(null);
  }

  @Action(CreateMap) createMap(
    ctx: StateContext<MapStateModel>,
    action: CreateMap
  ): void {
    console.log(`%cFirestore get: maps ${action.map.id}`, 'color: goldenrod');
    const docRef = doc(this.firestore, 'maps', action.map.id);
    getDoc(docRef).then((doc) => {
      if (doc.exists()) {
        const message = `Map ID "${action.map.id}" is already in use.  Please choose another.`;
        ctx.dispatch(new CreateMapError(message));
      } else {
        setDoc(docRef, { ...action.map, isDflt: false }, { merge: true });
      }
    });
  }

  currentMap(): Map {
    return this.store.snapshot().map;
  }

  @Action(DeleteMap) deleteMap(
    ctx: StateContext<MapStateModel>,
    action: DeleteMap
  ): void {
    ctx.dispatch(new ClearMap());
    console.log(`%cFirestore delete: maps ${action.id}`, 'color: crimson');
    const docRef = doc(this.firestore, 'maps', action.id);
    deleteDoc(docRef);
  }

  @Action(LoadMap) loadMap(
    ctx: StateContext<MapStateModel>,
    action: LoadMap
  ): void {
    // 👇 there's no map until there is one
    //    we can't use the old one!
    ctx.dispatch(new ClearMap());
    console.log(`%cFirestore get: maps ${action.id}`, 'color: goldenrod');
    const docRef = doc(this.firestore, 'maps', action.id);
    getDoc(docRef).then((doc) => {
      const map = doc.exists()
        ? (doc.data() as Map)
        : { ...action.dflt, isDflt: true };
      ctx.dispatch(new SetMap(map));
    });
  }

  @Action(SetMap) setMap(
    ctx: StateContext<MapStateModel>,
    action: SetMap
  ): void {
    ctx.setState(copy(action.map));
  }

  @Action(UpdateMap) updateMap(
    ctx: StateContext<MapStateModel>,
    action: UpdateMap
  ): void {
    if (action.refresh) ctx.dispatch(new ClearMap());
    if (action.map.isDflt) {
      console.log(`%cFirestore get: maps ${action.map.id}`, 'color: goldenrod');
      const docRef = doc(this.firestore, 'maps', action.map.id);
      getDoc(docRef).then((doc) => {
        if (doc.exists()) {
          const message = `Map ID "${action.map.id}" is already in use.  Please choose another.`;
          ctx.dispatch(new UpdateMapError(message));
        } else {
          setDoc(
            docRef,
            { ...action.map, isDflt: false },
            { merge: true }
          ).then(() => ctx.dispatch(new SetMap(action.map)));
        }
      });
    } else {
      console.log(
        `%cFirestore set: maps ${action.map.id} ${JSON.stringify(action.map)}`,
        'color: chocolate'
      );
      const docRef = doc(this.firestore, 'maps', action.map.id);
      setDoc(docRef, action.map, { merge: true }).then(() =>
        ctx.dispatch(new SetMap(action.map))
      );
    }
  }
}
