import { ParcelPropertiesUsage } from '../common';
import { ParcelPropertiesUse } from '../common';

import { Injectable } from '@angular/core';

const registry: Record<string, Record<string, Record<string, Descriptor>>> = {
  parcel: {
    // 🔥 this is certainly just valid for Washington
    neighborhood: {
      A: { decoding: 'AVG -40' },
      B: { decoding: 'AVG -30' },
      C: { decoding: 'AVG -20' },
      D: { decoding: 'AVG -10' },
      E: { decoding: 'AVG' },
      F: { decoding: 'AVG +10' },
      G: { decoding: 'AVG +20' },
      H: { decoding: 'MIXED USE' },
      I: { decoding: 'AVG +40' },
      J: { decoding: 'AVG +50' },
      K: { decoding: 'AVG +60' },
      L: { decoding: 'AVG +70' },
      M: { decoding: 'AVG +80' },
      N: { decoding: 'AVG +90' },
      P: { decoding: 'AVG +100' },
      Q: { decoding: 'SPECIAL 225%' },
      R: { decoding: 'SPECIAL 250%' },
      S: { decoding: 'SPECIAL 275%' },
      T: { decoding: 'SPECIAL 300%' },
      U: { decoding: 'ASHUELOT VACANT' },
      V: { decoding: 'VACANT' },
      W: { decoding: 'HIGHLAND VACANT' },
      X: { decoding: 'BACKLAND' }
    },
    usage: {
      '110': { decoding: 'Single Family Residence' },
      '120': { decoding: 'Multi Family Residence' },
      '130': { decoding: 'Other Residential' },
      '190': { decoding: 'Current Use' },
      '260': { decoding: 'Commercial / Industrial' },
      '300': { decoding: 'Town Property' },
      '400': { decoding: 'State Property' },
      '500': { decoding: 'State Park' },
      '501': { decoding: 'Town Forest' },
      '502': { decoding: 'Conservation Land' }
    } as Record<ParcelPropertiesUsage, Descriptor>,
    use: {
      CUWL: { decoding: 'Wetland' },
      CUFL: { decoding: 'Farmland' },
      CUMH: { decoding: 'Managed Hardwood' },
      CUUH: { decoding: 'Unmanaged Hardwood' },
      CUMW: { decoding: 'Managed Pine' },
      CUUW: { decoding: 'Unmanaged Pine' },
      CUMO: { decoding: 'Managed (Other)' },
      CUUO: { decoding: 'Unmanaged (Other)' },
      CUDE: { decoding: 'Discretionary' },
      CUNS: { decoding: 'Christmas Tree' },
      CUUL: { decoding: 'Unproductive' }
    } as Record<ParcelPropertiesUse, Descriptor>
  }
};

export interface Descriptor {
  decoding: string;
  description?: string;
  icon?: string;
  ref?: string;
}

@Injectable({ providedIn: 'root' })
export class TypeRegistry {
  decode(ctx: string, fld: string, encoding: any): string {
    const decoding = registry[ctx]?.[fld]?.[encoding]?.decoding;
    return decoding ?? encoding;
  }

  descriptor(ctx: string, fld: string, encoding: any): Descriptor {
    return registry[ctx]?.[fld]?.[encoding];
  }

  encode(ctx: string, fld: string, decoding: string): any {
    const entry = registry[ctx]?.[fld];
    if (!entry) return decoding;
    return Object.keys(entry).find((key) => entry[key].decoding === decoding);
  }

  icon(ctx: string, fld: string, val: any): string {
    return registry[ctx]?.[fld]?.[val]?.icon;
  }

  list(ctx: string, fld: string): [any, Descriptor][] {
    const entry = registry[ctx]?.[fld];
    return entry ? Object.entries(entry) : null;
  }
}
