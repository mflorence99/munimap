import { ParcelProperties } from '../geojson';

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
  value: string;
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
        stroke: '',
        value: schema.value
      })
    );
  }

  static schema(): OverlaySchema[] {
    return [
      {
        attribute: 'neighborhood',
        value: 'vacant',
        caption: 'Vacant parcels'
      },
      {
        attribute: 'area',
        value: 'quarter',
        caption: 'Parcels \u2264 \u00BC acre'
      },
      {
        attribute: 'area',
        value: 'half',
        caption: 'Parcels \u2264 \u00BD acre'
      },
      { attribute: 'area', value: 'one', caption: 'Parcels \u2264 1 acre' },
      { attribute: 'area', value: 'two', caption: 'Parcels \u2264 2 acres' },
      { attribute: 'area', value: 'four', caption: 'Parcels \u2264 4 acres' },
      {
        attribute: 'width',
        value: 'sixty',
        caption: 'Parcels \u2264 60ft wide'
      }
    ];
  }

  #isSet(): boolean {
    return this.currentProperties()?.some(
      (property) => property.enabled && (property.fill || property.stroke)
    );
  }

  #quantizeArea(area: number): string {
    if (area <= 0.25) return 'quarter';
    else if (area <= 0.5) return 'half';
    else if (area <= 1) return 'one';
    else if (area <= 2) return 'two';
    else if (area <= 4) return 'four';
    else return null;
  }

  #quantizeVacancy(neighborhood: string): string {
    if (['U', 'V', 'W'].includes(neighborhood)) return 'vacant';
    else return null;
  }

  #quantizeWidth(width: number): string {
    if (width <= 60) return 'sixty';
    else return null;
  }

  currentProperties(): OverlayProperty[] {
    return this.store.snapshot().overlay;
  }

  makeOverlayForParcelProperties(props: ParcelProperties): {
    fill: string;
    stroke: string;
  } {
    let fill: string = null;
    let stroke: string = null;
    if (this.#isSet()) {
      // 👉 these are the parameters for the overlay
      const model = {
        area: this.#quantizeArea(props.area),
        vacancy: this.#quantizeVacancy(props.neighborhood),
        width: this.#quantizeWidth(Math.min(...props.minWidths))
      };
      // 👉 in the case of conflict, this loop will make
      //    the last matching overlay win
      this.currentProperties()
        .filter((overlay) => overlay.enabled)
        .forEach((overlay) => {
          if (model[overlay.attribute] === overlay.value) {
            if (overlay.fill) fill = overlay.fill;
            if (overlay.stroke) stroke = overlay.stroke;
          }
        });
    }
    return { fill, stroke };
  }

  @Action(UpdateProperties) updateProperties(
    ctx: StateContext<OverlayStateModel>,
    action: UpdateProperties
  ): void {
    ctx.setState(action.properties);
  }
}
