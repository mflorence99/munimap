/* eslint-disable @typescript-eslint/naming-convention */
import { MapStyle } from '../state/map';
import { ParcelPropertiesUsage } from '@lib/geojson';
import { ParcelPropertiesUse } from '@lib/geojson';

import { Injectable } from '@angular/core';

const registry: Record<string, Record<string, Record<string, Descriptor>>> = {
  map: {
    style: {
      arcgis: {
        decoding: 'ArcGIS',
        description: 'Lorem ipsum erat vincit',
        icon: 'assets/arcgis.jpg',
        ref: 'https://www.arcgis.com/apps/mapviewer/index.html'
      },
      google: {
        decoding: 'Google',
        description: 'Lorem ipsum erat vincit',
        icon: 'assets/google.png',
        ref: 'https://www.google.com/maps'
      },
      mapbox: {
        decoding: 'Mapbox',
        description: 'Lorem ipsum erat vincit',
        icon: 'assets/mapbox.png',
        ref: 'https://www.mapbox.com/maps'
      },
      nhgranit: {
        decoding: 'NH GranIT',
        description: 'Lorem ipsum erat vincit',
        icon: 'assets/nhgranit.jpg',
        ref: 'https://www.granit.unh.edu/data/downloadfreedata/alphabetical/databyalpha.html'
      },
      osm: {
        decoding: 'OSM',
        description: 'Lorem ipsum erat vincit',
        icon: 'assets/osm.png',
        ref: 'https://www.openstreetmap.org/'
      }
    } as Record<MapStyle, Descriptor>
  },

  parcel: {
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
