import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

export class SetColorCode {
  static readonly type = '[ColorCode] SetColorCode';
  constructor(public state: Partial<ColorCodeStateModel>) {}
}

export type ColorCodeStrategy = 'use' | 'ownership' | 'conformity';

export interface ColorCodeStateModel {
  strategy: ColorCodeStrategy;
}

@State<ColorCodeStateModel>({
  name: 'colorcode',
  defaults: ColorCodeState.defaultState()
})
@Injectable()
export class ColorCodeState {
  static defaultState(): ColorCodeStateModel {
    return {
      strategy: 'use'
    };
  }

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetColorCode) setColorCode(
    { setState },
    { state }: SetColorCode
  ): void {
    setState(patch(state));
  }
}
