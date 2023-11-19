import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

export class SetColorCode {
  static readonly type = '[ColorCode] SetColorCode';
  constructor(public state: Partial<ColorCodeStateModel>) {}
}

export type ColorCodeStrategy = 'usage' | 'ownership' | 'conformity';

export interface ColorCodeStateModel {
  strategy: ColorCodeStrategy;
}

export function defaultColorCode(): ColorCodeStateModel {
  return {
    strategy: 'usage'
  };
}

@State<ColorCodeStateModel>({
  name: 'colorcode',
  defaults: defaultColorCode()
})
@Injectable()
export class ColorCodeState {
  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetColorCode) setColorCode(
    { setState },
    { state }: SetColorCode
  ): void {
    setState(patch(state));
  }
}
