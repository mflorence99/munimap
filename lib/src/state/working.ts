import { Injectable } from "@angular/core";
import { State } from "@ngxs/store";

// 🔥 this isn't a real state
//    instead, it acts as a proxy for the real states that are
//    recording periods when they are working on long-running tasks

export class Working {
  static readonly type = "[Working] Working";
  constructor(public increment: number) {}
}

export type WorkingStateModel = any;

@State<WorkingStateModel>({
  name: "working",
  defaults: {},
})
@Injectable()
export class WorkingState {}
