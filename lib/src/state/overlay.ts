import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

export class UpdateProperties {
  static readonly type = '[Overlay] UpdateProperties';
  constructor(public properties: OverlayProperty[]) {}
}

export interface OverlayProperty {
  attribute: string;
  enabled: boolean;
  fill: string;
  stroke: string;
}

export interface OverlaySchema {
  attribute: string;
  caption: string;
  value: string;
}

export type OverlayStateModel = OverlayProperty[];

@State<OverlayStateModel>({
  name: 'overlay',
  defaults: OverlayState.defaultState()
})
@Injectable()
export class OverlayState {
  constructor(private store: Store) {}

  static defaultState(): OverlayStateModel {
    return OverlayState.schema().map(
      (schema): OverlayProperty => ({
        attribute: schema.attribute,
        enabled: false,
        fill: '',
        stroke: ''
      })
    );
  }

  static schema(): OverlaySchema[] {
    return [
      {
        attribute: 'neighborhood',
        value: 'vacant',
        caption: 'Vacant'
      },
      {
        attribute: 'area',
        value: 'quarter',
        caption: 'Lots \u2264 \u00BC acre'
      },
      { attribute: 'area', value: 'half', caption: 'Lots \u2264 \u00BD acre' },
      { attribute: 'area', value: 'one', caption: 'Lots \u2264 1 acre' },
      { attribute: 'area', value: 'two', caption: 'Lots \u2264 2 acres' },
      { attribute: 'area', value: 'four', caption: 'Lots \u2264 4 acres' },
      { attribute: 'width', value: 'sixty', caption: 'Lots \u2264 60ft wide' }
    ];
  }

  get isSet(): boolean {
    return this.properties.some(
      (property) => property.enabled && (property.fill || property.stroke)
    );
  }

  get properties(): OverlayProperty[] {
    return this.store.snapshot().overlay;
  }

  @Action(UpdateProperties) updateProperties(
    ctx: StateContext<OverlayStateModel>,
    action: UpdateProperties
  ): void {
    ctx.setState(action.properties);
  }
}
