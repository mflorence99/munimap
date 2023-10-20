import { MapState } from './map';
import { ParcelProperties } from '../common';

import { getAPDVDFill } from '../apdvd';

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
        attribute: 'addressOfOwner',
        value: 'resident',
        caption: 'Residents'
      },
      {
        attribute: 'addressOfOwner',
        value: 'non-resident',
        caption: 'Non-residents'
      },
      {
        attribute: 'usage',
        value: 'public',
        caption: 'Institutional'
      },
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
      },
      {
        attribute: 'width',
        value: 'hundred',
        caption: 'Parcels \u2264 100ft wide'
      }
    ];
  }

  @Action(UpdateProperties) updateProperties(
    ctx: StateContext<OverlayStateModel>,
    action: UpdateProperties
  ): void {
    ctx.setState(action.properties);
  }

  currentProperties(): OverlayProperty[] {
    return this.store.snapshot().overlay;
  }

  makeOverlayForParcelProperties(props: ParcelProperties): {
    fill: [number, number, number];
    stroke: [number, number, number];
  } {
    let fill: string = null;
    let stroke: string = null;
    // 🔥 HACK FOR APDVD
    const map = this.store.selectSnapshot(MapState);
    if (map.id === 'apdvd') fill = getAPDVDFill(props);
    // 🔥 HACK FOR APDVD
    if (this.#isSet()) {
      // 👉 these are the parameters for the overlay
      const model = {
        addressOfOwner: this.#quantizeAddressOfOwner(
          props.addressOfOwner,
          props.usage
        ),
        area: this.#quantizeArea(props.area),
        usage: this.#quantizeUsage(props.usage),
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
    return { fill: this.#rgb(fill), stroke: this.#rgb(stroke) };
  }

  #isSet(): boolean {
    return this.currentProperties()?.some(
      (property) => property.enabled && (property.fill || property.stroke)
    );
  }

  // 🔥 this is a HACK for WASHINGTON only!!
  //    looking for Washington, Hillsborough or Marlow
  #quantizeAddressOfOwner(addressOfOwner: string, usage: string): string {
    // 🔥 TEMPORARY HACK
    if (['300', '400', '500', '501', '502'].includes(usage)) return 'null';
    // 🔥 TOTALLY Washington only!!
    return addressOfOwner?.includes('03280') ||
      addressOfOwner?.includes('03244') ||
      addressOfOwner?.includes('03456')
      ? 'resident'
      : 'non-resident';
  }

  #quantizeArea(area: number): string {
    if (area <= 0.25) return 'quarter';
    else if (area <= 0.5) return 'half';
    else if (area <= 1) return 'one';
    else if (area <= 2) return 'two';
    else if (area <= 4) return 'four';
    else return null;
  }

  #quantizeUsage(usage: string): string {
    if (['300', '400', '500', '501', '502'].includes(usage)) return 'public';
    else return null;
  }

  #quantizeVacancy(neighborhood: string): string {
    if (['N-U', 'N-V', 'N-W'].includes(neighborhood)) return 'vacant';
    else return null;
  }

  #quantizeWidth(width: number): string {
    if (width <= 60) return 'sixty';
    else if (width <= 100) return 'hundred';
    else return null;
  }

  // 👇 convert #rrggbb to [r, g, b]
  #rgb(hex: string): [number, number, number] {
    if (!hex) return null;
    else {
      const rgb = hex.substring(1).match(/.{1,2}/g);
      return [parseInt(rgb[0], 16), parseInt(rgb[1], 16), parseInt(rgb[2], 16)];
    }
  }
}
