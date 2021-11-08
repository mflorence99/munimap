import { point } from '@turf/helpers';

import area from '@turf/area';
import bbox from '@turf/bbox';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import firebase from 'firebase/app';
import length from '@turf/length';
import polylabel from 'polylabel';
import transformRotate from '@turf/transform-rotate';

// TODO 🔥 we share this code with nh-gis
//         yes, I know there's a better way

export type Feature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  ParcelProperties
>;

export type Features = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  ParcelProperties
>;

export interface Parcel extends Partial<Feature> {
  $id?: string /* 👈 optional only because we'll complete it */;
  added?: string | null | undefined;
  owner: string;
  path: string;
  removed?: string | null | undefined;
  timestamp?: any /* 👈 optional only because we'll complete it */;
}

// 👉 https://stackoverflow.com/questions/43909566

class ParcelPropertiesClass {
  constructor(
    public abutters: string[] /* 👈 legacy support */ = [],
    public address: string = '',
    public area: number = 0,
    public areas: number[] = [],
    public building$: number = null,
    public callouts: number[][] /* 👈 legacy support */ = [[]],
    public centers: number[][] = [[]],
    public county: string = '',
    public elevations: number[] /* 👈 legacy support */ = [],
    public id: string = '',
    public labels: ParcelPropertiesLabel[] /* 👈 legacy support */ = [],
    public land$: number = 0,
    public lengths: number[][] = [[]],
    public mergedWith: string[] = [],
    public minWidths: number[] = [],
    public neighborhood: ParcelPropertiesNeighborhood = null,
    public orientations: number[] = [],
    public other$: number = 0,
    public owner: string = '',
    public perimeters: number[] = [],
    public sqarcities: number[] = [],
    public taxed$: number = 0,
    public town: string = '',
    public usage: ParcelPropertiesUsage = null,
    public use: ParcelPropertiesUse = null,
    public zone: string = ''
  ) {}
}

export interface ParcelProperties extends Partial<ParcelPropertiesClass> {}

const modelParcel = new ParcelPropertiesClass();

export const parcelProperties = Object.keys(modelParcel);

// 👉 Firebase doesn't alllow nested arrays, so we must serialize
//    and deserialize these properties

const serializedProperties = Object.keys(modelParcel).filter(
  (prop) => Array.isArray(modelParcel[prop]) && modelParcel[prop].length > 0
);

export interface ParcelPropertiesLabel {
  rotate: boolean;
  split: boolean;
}

export type ParcelPropertiesNeighborhood = 'U' | 'V' | 'W' /* TODO 🔥 */;

export type ParcelPropertiesUsage =
  | '110' // Single family residence
  | '120' // Multi family residence
  | '130' // Other residential
  | '190' // Current use
  | '260' // Commercial / Industrial
  | '300' // Town property
  | '400' // State property
  | '500' // State park
  | '501' // Towm forest
  | '502'; // Conservation land

export type ParcelPropertiesUse =
  | 'CUDE' // Discretionary
  | 'CUFL' // Farm land
  | 'CUMH' // Managed hardwood
  | 'CUMO' // Managed other
  | 'CUMW' // Managed pine
  | 'CUNS' // Xmas tree
  | 'CUUH' // Unmanaged hardwood
  | 'CUUL' // Unproductive
  | 'CUUO' // Unmanaged other
  | 'CUUW' // Unmanaged pine
  | 'CUWL'; // Wetland

export function calculate(parcel: Parcel): void {
  if (parcel.geometry) {
    // 👉 convert MultiPolygons into an array of Polygons
    let polygons: GeoJSON.Feature<GeoJSON.Polygon>[] = [parcel as any];
    if (parcel.geometry.type === 'MultiPolygon') {
      polygons = parcel.geometry.coordinates.map((coordinates) => ({
        geometry: {
          coordinates: coordinates,
          type: 'Polygon'
        },
        properties: {},
        type: 'Feature'
      }));
    }
    // 👉 bbox applues to the whole geometry
    parcel.bbox = bbox(parcel);
    // 👉 now do calculations on each Polygon
    parcel.properties.areas = polygons.map((polygon) => calculateArea(polygon));
    parcel.properties.centers = polygons.map((polygon) =>
      calculateCenter(polygon)
    );
    parcel.properties.lengths = polygons.map((polygon) =>
      calculateLengths(polygon)
    );
    parcel.properties.orientations = polygons.map((polygon) =>
      calculateOrientation(polygon)
    );
    parcel.properties.minWidths = polygons.map((polygon, ix) =>
      calculateMinWidth(polygon, parcel.properties.orientations[ix])
    );
    parcel.properties.sqarcities = polygons.map((polygon, ix) =>
      calculateSqarcity(polygon, parcel.properties.lengths[ix])
    );
  } else if (parcel.geometry === null) {
    parcel.bbox = null;
    parcel.properties.areas = null;
    parcel.properties.centers = null;
    parcel.properties.lengths = null;
    parcel.properties.minWidths = null;
    parcel.properties.orientations = null;
    parcel.properties.sqarcities = null;
  }
}

function calculateArea(polygon: GeoJSON.Feature<GeoJSON.Polygon>): number {
  return area(polygon) * 0.000247105; /* 👈 to acres */
}

function calculateCenter(polygon: GeoJSON.Feature<GeoJSON.Polygon>): number[] {
  // 👉 we only want the polygon's outer ring
  const points = polygon.geometry.coordinates[0];
  return polylabel([points]);
}

function calculateLengths(polygon: GeoJSON.Feature<GeoJSON.Polygon>): number[] {
  const lengths = [];
  // 👉 we only want the polygon's outer ring
  const points = polygon.geometry.coordinates[0];
  for (let ix = 1; ix < points.length; ix++) {
    const lineString: GeoJSON.Feature = {
      geometry: {
        coordinates: [points[ix - 1], points[ix]],
        type: 'LineString'
      },
      properties: {},
      type: 'Feature'
    };
    lengths.push(length(lineString, { units: 'miles' }) * 5280); /* 👈 feet */
  }
  return lengths;
}

function calculateMinWidth(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  orientation: number
): number {
  const rotated = transformRotate(polygon, -orientation);
  const [minX, minY, , maxY] = bbox(rotated);
  const from = point([minX, minY]);
  const to = point([minX, maxY]);
  return distance(from, to, { units: 'miles' }) * 5280; /* 👈 feet */
}

function calculateOrientation(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
): number {
  let angle = 0;
  let longest = 0;
  // 👉 we only want the polygon's outer ring
  const points = polygon.geometry.coordinates[0];
  points.forEach((pt, ix) => {
    if (ix > 0) {
      const p = point(pt);
      const q = point(points[ix - 1]);
      const length = distance(p, q);
      if (length > longest) {
        angle =
          p.geometry.coordinates[0] < q.geometry.coordinates[0]
            ? bearing(p, q)
            : bearing(q, p);
        longest = length;
      }
    }
  });
  // convert bearing to rotation
  return angle - 90;
}

function calculateSqarcity(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  lengths: number[]
): number {
  const perimeter =
    lengths.reduce((sum, length) => sum + length) / 3.28084; /* 👈 to meters */
  return (area(polygon) / Math.pow(perimeter, 2)) * 4 * Math.PI;
}

export function deserialize(parcel: Parcel): void {
  if (parcel.geometry) parcel.geometry = JSON.parse(parcel.geometry as any);
  serializedProperties.forEach((prop) => {
    if (parcel.properties[prop])
      parcel.properties[prop] = JSON.parse(parcel.properties[prop]);
  });
}

export function normalize(parcel: Parcel): void {
  normalizeAddress(parcel);
  normalizeOwner(parcel);
}

function normalizeAddress(parcel: Parcel): void {
  if (parcel.properties.address) {
    let normalized = parcel.properties.address.trim().toUpperCase();
    normalized = normalized.replace(/\bCIR\b/, ' CIRCLE ');
    normalized = normalized.replace(/\bDR\b/, ' DRIVE ');
    normalized = normalized.replace(/\bE\b/, ' EAST ');
    normalized = normalized.replace(/\bHGTS\b/, ' HEIGHTS ');
    normalized = normalized.replace(/\bLN\b/, ' LANE ');
    normalized = normalized.replace(/\bMT\b/, ' MOUNTAIN ');
    normalized = normalized.replace(/\bN\b/, ' NORTH ');
    normalized = normalized.replace(/\bNO\b/, ' NORTH ');
    normalized = normalized.replace(/\bPD\b/, ' POND ');
    normalized = normalized.replace(/\bRD\b/, ' ROAD ');
    normalized = normalized.replace(/\bS\b/, ' SOUTH ');
    normalized = normalized.replace(/\bSO\b/, ' SOUTH ');
    normalized = normalized.replace(/\bST\b/, ' STREET ');
    normalized = normalized.replace(/\bTER\b/, ' TERRACE ');
    normalized = normalized.replace(/\bTERR\b/, ' TERRACE ');
    normalized = normalized.replace(/\bW\b/, ' WEST ');
    parcel.properties.address = normalized.replace(/  +/g, ' ').trim();
  }
}

function normalizeOwner(parcel: Parcel): void {
  if (parcel.properties.owner) {
    const normalized = parcel.properties.owner.trim().toUpperCase();
    parcel.properties.owner = normalized;
  }
}

export function serialize(parcel: Parcel): void {
  if (parcel.geometry) parcel.geometry = JSON.stringify(parcel.geometry) as any;
  serializedProperties.forEach((prop) => {
    if (parcel.properties[prop])
      parcel.properties[prop] = JSON.stringify(parcel.properties[prop]);
  });
}

export function timestamp(parcel: Parcel): void {
  if (!parcel.timestamp)
    parcel.timestamp = firebase.firestore.FieldValue.serverTimestamp();
}
