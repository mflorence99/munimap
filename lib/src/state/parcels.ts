import { Parcel } from "../common";
import { ParcelAction } from "../common";
import { ParcelID } from "../common";
import { AnonState } from "./anon";
import { AuthState } from "./auth";
import { Profile } from "./auth";
import { Map } from "./map";
import { MapState } from "./map";
import { CanDo } from "./undo";
import { ClearStacks } from "./undo";
import { Redo } from "./undo";
import { Undo } from "./undo";
import { Working } from "./working";

import { calculateParcel } from "../common";
import { deserializeParcel } from "../common";
import { normalizeParcel } from "../common";
import { serializeParcel } from "../common";
import { timestampParcel } from "../common";
import { workgroup } from "./auth";

import { Injectable } from "@angular/core";
import { CollectionReference } from "@angular/fire/firestore";
import { Firestore } from "@angular/fire/firestore";
import { Action } from "@ngxs/store";
import { Actions } from "@ngxs/store";
import { NgxsOnInit } from "@ngxs/store";
import { Selector } from "@ngxs/store";
import { State } from "@ngxs/store";
import { StateContext } from "@ngxs/store";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";

import { inject } from "@angular/core";
import { addDoc } from "@angular/fire/firestore";
import { collection } from "@angular/fire/firestore";
import { collectionData } from "@angular/fire/firestore";
import { deleteDoc } from "@angular/fire/firestore";
import { doc } from "@angular/fire/firestore";
import { orderBy } from "@angular/fire/firestore";
import { query } from "@angular/fire/firestore";
import { where } from "@angular/fire/firestore";
import { writeBatch } from "@angular/fire/firestore";
import { ofActionSuccessful } from "@ngxs/store";
import { combineLatest } from "rxjs";
import { merge } from "rxjs";
import { of } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { map } from "rxjs/operators";
import { mergeMap } from "rxjs/operators";

import copy from "fast-copy";
import hash from "object-hash";

const ACTION_SCOPE = "Parcels";

export namespace ParcelsActions {
  export class AddParcels {
    static readonly type = `[${ACTION_SCOPE}] AddParcels`;
    constructor(public parcels: Parcel[]) {}
  }

  export class ClearStacks {
    static readonly type = `[${ACTION_SCOPE}] ClearStacks`;
    constructor() {}
  }

  export class Redo {
    static readonly type = `[${ACTION_SCOPE}] Redo`;
    constructor() {}
  }

  export class SetParcels {
    static readonly type = `[${ACTION_SCOPE}] SetParcels`;
    constructor(public parcels: Parcel[]) {}
  }

  export class Undo {
    static readonly type = `[${ACTION_SCOPE}] Undo`;
    constructor() {}
  }
}

export type ParcelsStateModel = Parcel[];

// 👇 each item in the undo/redo stack is an array of atomic parcel actions

const maxStackSize = 7;
const redoStack: Parcel[][] = [];
const undoStack: Parcel[][] = [];

@State<ParcelsStateModel>({
  name: "parcels",
  defaults: []
})
@Injectable()
export class ParcelsState implements NgxsOnInit {
  map$: Observable<Map>;
  profile1$: Observable<Profile>;
  profile2$: Observable<Profile>;

  #actions$ = inject(Actions);
  #firestore = inject(Firestore);
  #store = inject(Store);

  constructor() {
    this.map$ = this.#store.select(MapState.map);
    // 👇 remember that that author app uses regular logins,
    //    while the viewer app uses anonymous logins --
    //    we don't care which here
    this.profile1$ = this.#store.select(AnonState.profile);
    this.profile2$ = this.#store.select(AuthState.profile);
  }

  @Selector() static parcels(state: ParcelsStateModel): Parcel[] {
    return state;
  }

  @Action(ParcelsActions.AddParcels) addParcels(
    ctx: StateContext<ParcelsStateModel>,
    action: ParcelsActions.AddParcels
  ): void {
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch([new CanDo(false, false), new Working(+1)]);
    // 👉 reset the stacks as required
    redoStack.length = 0;
    while (undoStack.length >= maxStackSize) undoStack.shift();
    // 🔥 batch has 500 limit
    const batch = writeBatch(this.#firestore);
    const undos: Parcel[] = [];
    undoStack.push(undos);
    const promises = action.parcels.map((parcel) => {
      const normalized = this.#normalize(parcel);
      console.log(
        `%cFirestore add: parcels ${JSON.stringify(normalized)}`,
        "color: chocolate"
      );
      const collectionRef = collection(this.#firestore, "parcels");
      return addDoc(collectionRef, normalized).then((ref) =>
        undos.push({ ...(normalized as Parcel), $id: ref.id })
      );
    });
    // 🔥 we have a great opportunity here to "cull" extraneous parcels
    batch
      .commit()
      .then(() => Promise.all(promises))
      .then(() => {
        ctx.dispatch([
          new CanDo(undoStack.length > 0, redoStack.length > 0),
          new Working(-1)
        ]);
      });
    // 👉 side-effect of handleStreams$ will update state
  }

  @Action(ParcelsActions.ClearStacks) clearStacks(
    ctx: StateContext<ParcelsStateModel>,
    _action: ParcelsActions.ClearStacks
  ): void {
    redoStack.length = 0;
    undoStack.length = 0;
    ctx.dispatch(new CanDo(false, false));
  }

  @Action(ParcelsActions.Redo) redo(
    ctx: StateContext<ParcelsStateModel>,
    _action: ParcelsActions.Redo
  ): void {
    // 👉 quick return if nothing to redo
    if (redoStack.length === 0) return;
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch([new CanDo(false, false), new Working(+1)]);
    // 👉 prepare the stacks
    const redos = redoStack.pop();
    const undos: Parcel[] = [];
    undoStack.push(undos);
    // 🔥 batch has 500 limit
    const batch = writeBatch(this.#firestore);
    const promises = redos.map((parcel) => {
      const collectionRef = collection(this.#firestore, "parcels");
      let promise;
      switch (parcel.action) {
        case "added":
          delete parcel.$id;
          parcel.action = "removed";
          promise = addDoc(collectionRef, parcel).then(() =>
            undos.push(parcel)
          );
          break;
        case "modified":
          delete parcel.$id;
          promise = addDoc(collectionRef, parcel).then((ref) =>
            undos.push({ ...copy(parcel), $id: ref.id })
          );
          break;
        case "removed":
          delete parcel.$id;
          parcel.action = "added";
          promise = addDoc(collectionRef, parcel).then(() =>
            undos.push(parcel)
          );
          break;
      }
      console.log(
        `%cFirestore add: parcels ${JSON.stringify(parcel)}`,
        "color: chocolate"
      );
      return promise;
    });
    batch
      .commit()
      .then(() => Promise.all(promises))
      .then(() => {
        ctx.dispatch([
          new CanDo(undoStack.length > 0, redoStack.length > 0),
          new Working(-1)
        ]);
      });
    // 👉 side-effect of handleStreams$ will update state
  }

  @Action(ParcelsActions.SetParcels) setParcels(
    ctx: StateContext<ParcelsStateModel>,
    action: ParcelsActions.SetParcels
  ): void {
    this.#logParcels(action.parcels);
    ctx.setState(action.parcels);
  }

  @Action(ParcelsActions.Undo) undo(
    ctx: StateContext<ParcelsStateModel>,
    _action: ParcelsActions.Undo
  ): void {
    // 👉 quick return if nothing to undo
    if (undoStack.length === 0) return;
    // 👉 block any other undo, redo until this is finished
    ctx.dispatch([new CanDo(false, false), new Working(+1)]);
    // 👉 prepare the stacks
    const undos = undoStack.pop();
    const redos: Parcel[] = [];
    redoStack.push(redos);
    // 🔥 batch has 500 limit
    const batch = writeBatch(this.#firestore);
    const promises = undos.map((parcel) => {
      const collectionRef = collection(this.#firestore, "parcels");
      let docRef, promise;
      switch (parcel.action) {
        case "added":
          delete parcel.$id;
          parcel.action = "removed";
          promise = addDoc(collectionRef, parcel).then(() =>
            redos.push(parcel)
          );
          break;
        case "modified":
          docRef = doc(this.#firestore, "parcels", parcel.$id);
          promise = deleteDoc(docRef).then(() => redos.push(parcel));
          break;
        case "removed":
          delete parcel.$id;
          parcel.action = "added";
          promise = addDoc(collectionRef, parcel).then(() =>
            redos.push(parcel)
          );
          break;
      }
      console.log(
        `%cFirestore add: parcels ${JSON.stringify(parcel)}`,
        "color: chocolate"
      );
      return promise;
    });
    batch
      .commit()
      .then(() => Promise.all(promises))
      .then(() => {
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

  parcelsAdded(parcels: Parcel[]): Set<ParcelID> {
    const hash = this.#lastActionByParcelID(parcels);
    return new Set(Object.keys(hash).filter((id) => hash[id] === "added"));
  }

  // 👉 consider the entire stream of parcels, in reverse timestamp order
  //    separate them by ID -- once a "removed" action found,
  //    ignore prior modifications
  parcelsModified(parcels: Parcel[]): Record<ParcelID, Parcel[]> {
    const removedIDs = new Set<ParcelID>();
    return parcels.reduce((acc, parcel) => {
      if (parcel.action === "removed") removedIDs.add(parcel.id);
      if (!removedIDs.has(parcel.id)) {
        if (!acc[parcel.id]) acc[parcel.id] = [];
        acc[parcel.id].push(parcel);
      }
      return acc;
    }, {});
  }

  parcelsRemoved(parcels: Parcel[]): Set<ParcelID> {
    const hash = this.#lastActionByParcelID(parcels);
    return new Set(Object.keys(hash).filter((id) => hash[id] === "removed"));
  }

  // 👇 listen for "undo" actions directed at the proxy

  #handleActions$(): void {
    this.#actions$
      .pipe(ofActionSuccessful(ClearStacks, Redo, Undo))
      .subscribe((action: ClearStacks | Redo | Undo) => {
        if (action instanceof ClearStacks)
          this.#store.dispatch(new ParcelsActions.ClearStacks());
        else if (action instanceof Redo)
          this.#store.dispatch(new ParcelsActions.Redo());
        else if (action instanceof Undo)
          this.#store.dispatch(new ParcelsActions.Undo());
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
            console.log(
              `%cFirestore query: parcels where owner in ${JSON.stringify(
                workgroup(profile)
              )} and path == "${map.path}" orderBy timestamp desc`,
              "color: goldenrod"
            );
            return collectionData<Parcel>(
              query(
                collection(
                  this.#firestore,
                  "parcels"
                ) as CollectionReference<Parcel>,
                where("owner", "in", workgroup(profile)),
                where("path", "==", map.path),
                orderBy("timestamp", "desc")
              ),
              { idField: "$id" }
            );
          }
        }),
        map((parcels: Parcel[]) => {
          parcels.forEach((parcel) => deserializeParcel(parcel));
          return parcels;
        }),
        // 👉 cut down on noise
        distinctUntilChanged(
          (p: any, q: any): boolean => hash.MD5(p) === hash.MD5(q)
        )
      )
      .subscribe((parcels: Parcel[]) => {
        this.#store.dispatch(new ParcelsActions.SetParcels(parcels));
      });
  }

  // 👇 considering the parcels in reverse chronological order and ignoring
  //    "modified" actions, was the last action "add" or "remove"?
  #lastActionByParcelID(parcels: Parcel[]): Record<ParcelID, ParcelAction> {
    return parcels
      .filter((parcel) => parcel.action !== "modified")
      .reduce((acc, parcel) => {
        if (!acc[parcel.id]) acc[parcel.id] = parcel.action;
        return acc;
      }, {});
  }

  #logParcels(parcels: Parcel[]): void {
    console.table(
      parcels.map((parcel) => {
        return {
          action: parcel.action,
          id: parcel.id,
          geometry: parcel.geometry?.type,
          address: parcel.properties?.address,
          area: parcel.properties?.area,
          neighborhood: parcel.properties?.neighborhood,
          owner: parcel.properties?.owner,
          usage: parcel.properties?.usage,
          use: parcel.properties?.use,
          building$: parcel.properties?.building$,
          land$: parcel.properties?.land$,
          other$: parcel.properties?.other$,
          taxed$: parcel.properties?.taxed$
        };
      })
    );
  }

  #normalize(parcel: Partial<Parcel>): Partial<Parcel> {
    const normalized = copy(parcel);
    calculateParcel(normalized);
    normalizeParcel(normalized);
    serializeParcel(normalized);
    timestampParcel(normalized);
    return normalized;
  }
}
