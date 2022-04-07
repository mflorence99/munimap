import { point } from '@turf/helpers';
import { serverTimestamp } from 'firebase/firestore';

import area from '@turf/area';
import bbox from '@turf/bbox';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import length from '@turf/length';
import polylabel from 'polylabel';
import rhumbDestination from '@turf/rhumb-destination';
import rhumbDistance from '@turf/rhumb-distance';
import transformRotate from '@turf/transform-rotate';

// 🔥 we need to share this code with the "bin" programs
//    that's why it isn't an Angular service, for example

// 👇 we currently only support one state
export const theState = 'NEW HAMPSHIRE';

export interface BridgeProperties {
  rygb: 'red' | 'yellow' | 'green' | 'blue';
}

export type Building = GeoJSON.Feature<GeoJSON.Polygon, BuildingProperties>;

export type Buildings = GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  BuildingProperties
>;

export interface BuildingProperties {}

export interface ConservationProperties {
  name: string;
}

export interface LakeProperties {
  county: string;
  name: string;
  town: string;
}

export interface Landmark
  extends GeoJSON.Feature<
    | GeoJSON.Point
    | GeoJSON.MultiPoint
    | GeoJSON.LineString
    | GeoJSON.MultiLineString
    | GeoJSON.Polygon
    | GeoJSON.MultiPolygon,
    LandmarkProperties
  > {
  $id?: string /* 👈 optional only because we'll complete it */;
  curated?: boolean;
  owner: string;
  path: string;
}

export type Landmarks = GeoJSON.FeatureCollection<
  | GeoJSON.Point
  | GeoJSON.MultiPoint
  | GeoJSON.LineString
  | GeoJSON.MultiLineString
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon,
  LandmarkProperties
>;

class LandmarkPropertiesClass {
  constructor(
    public name: string = null,
    public fillColor: string = null,
    public fillOpacity: number = 0,
    public strokeColor: string = null,
    public strokeOpacity: number = 0,
    public strokeWidth: number = 0
  ) {}
}

export interface LandmarkProperties extends Partial<LandmarkPropertiesClass> {}

const modelLandmark = new LandmarkPropertiesClass();

export const landmarkProperties = Object.keys(modelLandmark);

// 👉 Firebase doesn't alllow nested arrays, so we must serialize
//    and deserialize these properties

const serializedLandmarkProperties = Object.keys(modelLandmark).filter(
  (prop) => Array.isArray(modelLandmark[prop]) && modelLandmark[prop].length > 0
);

export interface Parcel
  extends Partial<
    GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, ParcelProperties>
  > {
  $id?: string /* 👈 optional only because we'll complete it */;
  action: ParcelAction;
  id: ParcelID /* 👈 in Feature, also here just to remind us */;
  owner: string;
  path: string;
  timestamp?: any /* 👈 optional only because we'll complete it */;
}

export type SearchableParcel = Partial<Parcel>;

export type Parcels = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  ParcelProperties
>;

export type SearchableParcels = Partial<Parcels>;

export type ParcelAction = 'added' | 'modified' | 'removed';

export type ParcelID = string | number;

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
    public id: ParcelID = null,
    public labels: ParcelPropertiesLabel[] /* 👈 legacy support */ = [],
    public land$: number = 0,
    public lengths: number[][] = [[]],
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

const serializedParcelProperties = Object.keys(modelParcel).filter(
  (prop) => Array.isArray(modelParcel[prop]) && modelParcel[prop].length > 0
);

export interface ParcelPropertiesLabel {
  rotate: boolean;
  split: boolean;
}

export type ParcelPropertiesNeighborhood = '' | 'U' | 'V' | 'W';

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
  | ''
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

export interface PlaceProperties {
  county: string;
  name: string;
  town: string;
  type: PlacePropertiesType;
}

export type PlacePropertiesType =
  | 'airport'
  | 'area'
  | 'bar'
  | 'basin'
  | 'bay'
  | 'beach'
  | 'bench'
  | 'bend'
  | 'bridge'
  | 'building'
  | 'canal'
  | 'cape'
  | 'cave'
  | 'cemetery'
  | 'channel'
  | 'church'
  | 'civil'
  | 'cliff'
  | 'crossing'
  | 'dam'
  | 'falls'
  | 'flat'
  | 'forest'
  | 'gap'
  | 'gut'
  | 'harbor'
  | 'hospital'
  | 'island'
  | 'lake'
  | 'locale'
  | 'military'
  | 'mine'
  | 'other'
  | 'park'
  | 'pillar'
  | 'po'
  | 'ppl'
  | 'range'
  | 'rapids'
  | 'reserve'
  | 'reservoir'
  | 'ridge'
  | 'school'
  | 'sea'
  | 'slope'
  | 'spring'
  | 'stream'
  | 'summit'
  | 'swamp'
  | 'tower'
  | 'trail'
  | 'valley'
  | 'woods';

export interface PowerlineProperties {
  county: string;
  town: string;
}

export interface RailroadProperties {
  active: boolean;
  name: string;
}

export interface RiverProperties {
  county: string;
  name: string;
  section: string;
  town: string;
  type: 'river' | 'stream';
}

export interface RoadProperties {
  class: RoadPropertiesClass;
  county: string;
  name: string;
  owner: string;
  town: string;
  width: number;
}

export type RoadPropertiesClass = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | '0';

export interface TrailProperties {
  county: string;
  name: string;
  system: string;
  town: string;
}

export interface WetlandProperties {
  type: 'water' | 'marsh';
}

export interface CountyIndex {
  [town: string]: TownIndex | Record<string, Layer>;
  layers: {
    boundary: Layer;
    selectables: Layer;
    towns: Layer;
  };
}

export interface Index {
  [state: string]: StateIndex;
}

export interface Layer {
  available: boolean;
  name: string;
  url: string;
}

export interface TownIndex {
  layers: {
    boundary: Layer;
    buildings: Layer;
    countables: Layer;
    lakes: Layer;
    parcels: Layer;
    places: Layer;
    powerlines: Layer;
    rivers: Layer;
    roads: Layer;
    searchables: Layer;
    selectables: Layer;
    trails: Layer;
  };
}

export interface StateIndex {
  [county: string]: CountyIndex | Record<string, Layer>;
  layers: {
    boundary: Layer;
    counties: Layer;
    railroads: Layer;
    selectables: Layer;
    towns: Layer;
  };
}

export const isIndex = (name: string): boolean => /^[A-Z ]*$/.test(name);

// 👉 calculate bbox based on desired dimensions

export function bboxByDimensions(
  geojson: GeoJSON.FeatureCollection | GeoJSON.Feature | number[],
  cxDesired: number,
  cyDesired: number
): GeoJSON.BBox {
  // 👉 calculate bbox dimensions
  const [minX, minY, maxX, maxY] = Array.isArray(geojson)
    ? geojson
    : bbox(geojson);
  const [cx, cy] = bboxDistance(minX, minY, maxX, maxY);
  // 👉 calculate amount of expansion needed
  const cxDelta = (cxDesired - cx) / 2;
  if (cxDelta < 0) console.error(`🔥 cx -ve ${cxDelta}`);
  const cyDelta = (cyDesired - cy) / 2;
  if (cyDelta < 0) console.error(`🔥 cy -ve ${cyDelta}`);
  // 👉 calculate new extermities
  const newMinX = rhumbDestination([minX, minY], cxDelta, -90);
  const newMaxX = rhumbDestination([maxX, minY], cxDelta, 90);
  const newMinY = rhumbDestination([minX, minY], cyDelta, 180);
  const newMaxY = rhumbDestination([minX, maxY], cyDelta, 0);
  // 👉 now we have the expanded bbox
  return [
    cxDelta ? newMinX.geometry.coordinates[0] : minX,
    cyDelta ? newMinY.geometry.coordinates[1] : minY,
    cxDelta ? newMaxX.geometry.coordinates[0] : maxX,
    cyDelta ? newMaxY.geometry.coordinates[1] : maxY
  ];
}

// 👉 calculate bbox based on desired aspect ratio
//    we'll pick the best (inverting if necessary)
//    then expand to the nearest whole "units"

// 👇 function split in two to enable debug logging

export function bboxByAspectRatio(
  geojson: GeoJSON.FeatureCollection | GeoJSON.Feature | number[],
  x: number,
  y: number,
  b = 0.5 /* 👈 buffer in km */
): GeoJSON.BBox {
  if (x < y) console.error(`🔥 x(${x}) must be greater than y${y})`);
  const [minX, minY, maxX, maxY] = bboxByAspectRatioImpl(geojson, x, y, b);
  return [minX, minY, maxX, maxY];
}

function bboxByAspectRatioImpl(
  geojson: GeoJSON.FeatureCollection | GeoJSON.Feature | number[],
  x: number,
  y: number,
  b: number
): GeoJSON.BBox {
  // 👉 calculate bbox dimensions
  const [minX, minY, maxX, maxY] = Array.isArray(geojson)
    ? geojson
    : bbox(geojson);
  const [cx, cy] = bboxDistance(minX, minY, maxX, maxY);
  // 👉 compare aspect ratios and pick best one
  const ar = cx / cy;
  // 👉 aspect ration less than 1 means portrait
  if (ar < 1) {
    const z = (cy * y) / x;
    // account for buffer
    const bx = b;
    const by = (b * x) / y;
    // can't make cx smaller!
    const dx = Math.max(cx - z, 0);
    const dy = (dx * x) / y;
    return bboxByDimensions(geojson, z + bx + dx, cy + by + dy);
  }
  // 👉 OK, must be landscape
  else {
    const z = (cx * y) / x;
    // account for buffer
    const by = b;
    const bx = (by * x) / y;
    // can't make cy smaller!
    const dy = Math.max(cy - z, 0);
    const dx = (dy * x) / y;
    return bboxByDimensions(geojson, cx + bx + dx, z + by + dy);
  }
}

export function bboxDistance(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): [number, number] {
  const cx = rhumbDistance([minX, minY], [maxX, minY], {
    units: 'kilometers'
  });
  const cy = rhumbDistance([minX, minY], [minX, maxY], {
    units: 'kilometers'
  });
  return [cx, cy];
}

export function calculateParcel(parcel: Parcel): void {
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
    parcel.properties ??= {};
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

export function calculateArea(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
): number {
  return area(polygon) * 0.000247105; /* 👈 to acres */
}

export function calculateCenter(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
): number[] {
  // 👉 we only want the polygon's outer ring
  const points = polygon.geometry.coordinates[0];
  return polylabel([points]);
}

export function calculateLengths(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
): number[] {
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
    lengths.push(
      Math.round(length(lineString, { units: 'miles' }) * 5280 /* 👈 feet */)
    );
  }
  return lengths;
}

export function calculateMinWidth(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  orientation: number
): number {
  const rotated = transformRotate(polygon, -orientation);
  const [minX, minY, , maxY] = bbox(rotated);
  const from = point([minX, minY]);
  const to = point([minX, maxY]);
  return Math.round(
    distance(from, to, { units: 'miles' }) * 5280 /* 👈 feet */
  );
}

export function calculateOrientation(
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

export function calculateSqarcity(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  lengths: number[]
): number {
  const perimeter =
    lengths.reduce((sum, length) => sum + length) / 3.28084; /* 👈 to meters */
  return (area(polygon) / Math.pow(perimeter, 2)) * 4 * Math.PI;
}

export function dedupe(geojsons: Buildings[]): Buildings {
  const hash = geojsons.reduce((acc, geojson) => {
    geojson.features.forEach((feature) => (acc[feature.id] = feature));
    return acc;
  }, {});
  return {
    features: Object.values(hash),
    type: 'FeatureCollection'
  };
}

export function deserializeLandmark(landmark: Landmark): void {
  if (landmark.geometry)
    landmark.geometry = JSON.parse(landmark.geometry as any);
  if (landmark.properties) {
    serializedLandmarkProperties.forEach((prop) => {
      if (landmark.properties[prop])
        landmark.properties[prop] = JSON.parse(landmark.properties[prop]);
    });
  }
}

export function deserializeParcel(parcel: Parcel): void {
  if (parcel.geometry) parcel.geometry = JSON.parse(parcel.geometry as any);
  if (parcel.properties) {
    serializedParcelProperties.forEach((prop) => {
      if (parcel.properties[prop])
        parcel.properties[prop] = JSON.parse(parcel.properties[prop]);
    });
  }
}

export function normalizeParcel(parcel: Parcel): void {
  if (parcel.properties) {
    normalizeAddress(parcel);
    normalizeOwner(parcel);
  }
}

export function normalizeAddress(parcel: Parcel): void {
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

export function normalizeOwner(parcel: Parcel): void {
  if (parcel.properties.owner) {
    const normalized = parcel.properties.owner.trim().toUpperCase();
    parcel.properties.owner = normalized;
  }
}

export function serializeLandmark(landmark: Landmark): void {
  if (landmark.geometry)
    landmark.geometry = JSON.stringify(landmark.geometry) as any;
  if (landmark.properties) {
    serializedLandmarkProperties.forEach((prop) => {
      if (landmark.properties[prop])
        landmark.properties[prop] = JSON.stringify(landmark.properties[prop]);
    });
  }
}

export function serializeParcel(parcel: Parcel): void {
  if (parcel.geometry) parcel.geometry = JSON.stringify(parcel.geometry) as any;
  if (parcel.properties) {
    serializedParcelProperties.forEach((prop) => {
      if (parcel.properties[prop])
        parcel.properties[prop] = JSON.stringify(parcel.properties[prop]);
    });
  }
}

// 👉 trim all coordinates to 5 DP's or ~3ft accuracy
//    http://wiki.gis.com/wiki/index.php/Decimal_degrees
export function simplify(
  geojson: GeoJSON.FeatureCollection
): GeoJSON.FeatureCollection {
  const trunc = (coords): number[] =>
    coords.map((coord) =>
      Number((Math.floor(coord * 100000) / 100000).toFixed(5))
    );

  const traverse = (array): void => {
    for (let ix = 0; ix < array.length; ix++) {
      if (
        array[ix].length === 2 &&
        !isNaN(array[ix][0]) &&
        !isNaN(array[ix][1])
      )
        array[ix] = trunc(array[ix]);
      else traverse(array[ix]);
    }
  };

  geojson.features.forEach((feature: GeoJSON.Feature<any>) => {
    if (feature.bbox) feature.bbox = trunc(feature.bbox) as GeoJSON.BBox;
    if (feature.geometry?.coordinates) traverse(feature.geometry.coordinates);
  });
  return geojson;
}

export function timestampParcel(parcel: Parcel): void {
  if (!parcel.timestamp) parcel.timestamp = serverTimestamp();
}
