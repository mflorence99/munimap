import { Units } from '@turf/helpers';

import { area } from '@turf/area';
import { bbox } from '@turf/bbox';
import { bearing } from '@turf/bearing';
import { convertArea } from '@turf/helpers';
import { convertLength } from '@turf/helpers';
import { distance } from '@turf/distance';
import { featureCollection } from '@turf/helpers';
import { length } from '@turf/length';
import { point } from '@turf/helpers';
import { rhumbDestination } from '@turf/rhumb-destination';
import { rhumbDistance } from '@turf/rhumb-distance';
import { serverTimestamp } from 'firebase/firestore';
import { transformRotate } from '@turf/transform-rotate';
import { truncate } from '@turf/truncate';

import hash from 'object-hash';
import polylabel from 'polylabel';

// 🔥 we need to share this code with the "bin" programs
//    that's why it isn't an Angular service, for example

// 👇 we currently only support one state
export const theState = 'NEW HAMPSHIRE';

/* eslint-disable @typescript-eslint/naming-convention */

export interface BridgeProperties {
  // 👇 original bridges schema
  ALT_LENGTH: number /* 👈 ALT_LENGTH */;
  APPROACH_SPAN_DESIGN: string /* 👈 APPROACH_SPAN_DESIGN */;
  APPROACH_SPAN_MATERIAL: string /* 👈 APPROACH_SPAN_MATERIAL */;
  BRIDGE_ID: string /* 👈 BRIDGE_ID */;
  BRIDGE_TIER: number /* 👈 BRIDGE_TIER */;
  BRIDGE_TYPE: string /* 👈 BRIDGE_TYPE */;
  BRIDGE_TYPE_DESCR: string /* 👈 BRIDGE_TYPE_DESCR */;
  COUNTY: string /* 👈 COUNTY */;
  CREATE_DATE: Date /* 👈 CREATE_DATE */;
  DECKWIDTH_FEET: number /* 👈 DECKWIDTH_FEET */;
  DECK_AREA_FEET: number /* 👈 DECK_AREA_FEET */;
  DECK_DESCRIPTION: string /* 👈 DECK_DESCRIPTION */;
  DISTRICT: string /* 👈 DISTRICT */;
  EAST: string /* 👈 EAST */;
  FACILITY: string /* 👈 FACILITY */;
  FEATINT: string /* 👈 FEATINT */;
  FROM_MP: number /* 👈 FROM_MP */;
  HEIGHT_SIGN_REC_AW: string /* 👈 HEIGHT_SIGN_REC_AW */;
  HISTSIGN: string /* 👈 HISTSIGN */;
  IS_PRIMARY_SRI: number /* 👈 IS_PRIMARY_SRI */;
  LATITUDE: number /* 👈 LATITUDE */;
  LENGTH_FEET: number /* 👈 LENGTH_FEET */;
  LOCATION: string /* 👈 LOCATION */;
  LONGITUDE: number /* 👈 LONGITUDE */;
  MAINSPANS: string /* 👈 MAINSPANS */;
  MAIN_SPAN_DESIGN: string /* 👈 MAIN_SPAN_DESIGN */;
  MAIN_SPAN_MATERIAL: string /* 👈 MAIN_SPAN_MATERIAL */;
  MAXSPAN_FEET: number /* 👈 MAXSPAN_FEET */;
  MP: number /* 👈 MP */;
  NBISLEN: string /* 👈 NBISLEN */;
  NBISLEN_DESCR: string /* 👈 NBISLEN_DESCR */;
  NBI_RATING: string /* 👈 NBI_RATING */;
  NORTH: string /* 👈 NORTH */;
  OBJECTID: string /* 👈 OBJECTID */;
  OWNER: string /* 👈 OWNER */;
  PLAN_FILENAMES: string /* 👈 PLAN_FILENAMES */;
  PLAN_FOLDER: string /* 👈 PLAN_FOLDER */;
  POA_HOTLINK: string /* 👈 POA_HOTLINK */;
  REDLIST: string /* 👈 REDLIST */;
  ROUTE_PREFIX: string /* 👈 ROUTE_PREFIX */;
  ROUTE_TYPE: string /* 👈 ROUTE_TYPE */;
  RYGB: string /* 👈 RYGB */;
  SKEW: string /* 👈 SKEW */;
  SRI: string /* 👈 SRI */;
  STRUCTNAME: string /* 👈 STRUCTNAME */;
  STRUCT_NUM: string /* 👈 STRUCT_NUM */;
  TEMP_UID: string /* 👈 TEMP_UID */;
  TIER: string /* 👈 TIER */;
  TOT_LENGTH_FEET: number /* 👈 TOT_LENGTH_FEET */;
  TOWN: string /* 👈 TOWN */;
  TOWN_ID: string /* 👈 TOWN_ID */;
  TO_MP: number /* 👈 TO_MP */;
  TYPE_SERVICE_ON: string /* 👈 TYPE_SERVICE_ON */;
  TYPE_SERVICE_UNDER: string /* 👈 TYPE_SERVICE_UNDER */;
  UNIQUE_ID: number /* 👈 UNIQUE_ID */;
  VCLROVER: number /* 👈 VCLROVER */;
  VCLRUNDER: number /* 👈 VCLRUNDER */;
  WEIGHT_SIGN_REC: string /* 👈 WEIGHT_SIGN_REC */;
  X_COORD: number /* 👈 X_COORD */;
  YEARBUILT: string /* 👈 YEARBUILT */;
  YEARRECON: string /* 👈 YEARRECON */;
  Y_COORD: number /* 👈 Y_COORD */;
  // 👇 translated bridges schema
  name: string;
  // 🔥 disambiguate bridges, culverts, flood hazards and stream crossings
  type: 'bridge';
}

export type Building = GeoJSON.Feature<GeoJSON.Polygon, BuildingProperties>;

export type Buildings = GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  BuildingProperties
>;

export interface BuildingProperties {
  name: string;
}

export interface ConservationProperties {
  // 👇 original conservation schema
  NAME: string;
  OBJECTID: string;
  // 👇 translated conservation schema
  name: string;
}

// 👀 https://stackoverflow.com/questions/44480644/string-union-to-string-array

export const culvertConditions = ['Unknown', 'Poor', 'Fair', 'Good'] as const;
export const culvertFloodHazards = [
  'None',
  'Minor',
  'Moderate',
  'Major'
] as const;
export const culvertHeadwalls = ['None', 'Handmade', 'Precast'] as const;
export const culvertMaterials = [
  'Unknown',
  'Concrete',
  'Plastic',
  'Steel'
] as const;

export type CulvertCondition = (typeof culvertConditions)[number];
export type CulvertFloodHazard = (typeof culvertFloodHazards)[number];
export type CulvertHeadwall = (typeof culvertHeadwalls)[number];
export type CulvertMaterial = (typeof culvertMaterials)[number];

export interface CulvertProperties {
  condition: CulvertCondition;
  count: number /* 2x, 3x etc */;
  description: string;
  diameter: number /* 👈 inches, circular pipes */;
  floodHazard: CulvertFloodHazard;
  headwall: CulvertHeadwall;
  height: number /* 👈 inches, elliptical pipes */;
  length: number /* 👈 feet */;
  location: string;
  material: CulvertMaterial;
  // 🔥 disambiguate bridges, culverts, flood hazards and stream crossings
  type: 'culvert';
  width: number /* 👈 inches, elliptical pipes */;
  year: number;
}

export interface DamProperties {
  // 👇 original dams schema
  CNTY: string /* 👈 CNTY */;
  DAAC: number /* 👈 DAAC */;
  DAM: string /* 👈 DAM */;
  DOWNER: string /* 👈 DOWNER */;
  FERC: string /* 👈 FERC */;
  HAZCL: string /* 👈 HAZCL */;
  HEIGHT: number /* 👈 HEIGHT */;
  IMPND: number /* 👈 IMPND */;
  LATITUDE: number /* 👈 LATITUDE */;
  LENGTH: number /* 👈 LENGTH */;
  LONGITUDE: number /* 👈 LONGITUDE */;
  NAME: string /* 👈 NAME */;
  NATDAMID: string /* 👈 NATDAMID */;
  OBJECTID: string /* 👈 OBJECTID */;
  RIVER: string /* 👈 RIVER */;
  STATUS: string /* 👈 STATUS */;
  TOWN: string /* 👈 TOWN */;
  USE: string /* 👈 USE */;
  // 👇 translated dams schema
  name: string;
  type: 'dam';
}

export interface FloodHazardProperties {
  // 👇 original floodhazards schema
  CreationDa: Date /* 👈 CreationDa */;
  Creation_1: Date /* 👈 Creation_1 */;
  Creator: string /* 👈 Creator */;
  Creator_1: string /* 👈 Creator_1 */;
  CrossIssue: string /* 👈 CrossIssue */;
  CrossType: string /* 👈 CrossType */;
  EditDate: Date /* 👈 EditDate */;
  EditDate_1: Date /* 👈 EditDate_1 */;
  Editor: string /* 👈 Editor */;
  Editor_1: string /* 👈 Editor_1 */;
  FID: string /* 👈 FID */;
  FloodDate: string /* 👈 FloodDate */;
  FloodDesc: string /* 👈 FloodDesc */;
  FloodHazID: string /* 👈 FloodHazID */;
  FloodPerio: string /* 👈 FloodPerio */;
  FloodType: string /* 👈 FloodType */;
  Frequency: string /* 👈 Frequency */;
  GlobalID: string /* 👈 GlobalID */;
  Impact: string /* 👈 Impact */;
  Location: string /* 👈 Location */;
  MitAction: string /* 👈 MitAction */;
  ORIG_FID: number /* 👈 ORIG_FID */;
  RPC_Area: string /* 👈 RPC_Area */;
  Shape__Are: number /* 👈 Shape__Are */;
  Shape__Len: number /* 👈 Shape__Len */;
  Source: string /* 👈 Source */;
  Town: string /* 👈 Town */;
  Verified: string /* 👈 Verified */;
  // 👇 translated floodhazards schema  name: string;
  name: string;
  // 🔥 disambiguate bridges, culverts, flood hazards and stream crossings
  type: 'flood hazard';
}

export interface FloodplainProperties {
  // 👇 original floodplain schema
  AR_REVERT: string /* 👈 AR_REVERT */;
  BFE_REVERT: number /* 👈 BFE_REVERT */;
  DEPTH: number /* 👈 DEPTH */;
  DEP_REVERT: number /* 👈 DEP_REVERT */;
  DFIRM_STUDY: string /* 👈 DFIRM_Study */;
  FLD_AR_ID: string /* 👈 FLD_AR_ID */;
  FLD_ZONE: string /* 👈 Flood Zone */;
  FLD_ZONE_SVD: string /* 👈 FLD_ZONE_SVD */;
  FLOODWAY: string /* 👈 FLOODWAY */;
  LEN_UNIT: string /* 👈 Units */;
  OBJECTID: string /* 👈 OBJECTID */;
  SFHA_TF: string /* 👈 SFHA_TF */;
  SHAPE_Area: number /* 👈 SHAPE_Area */;
  SHAPE_Length: number /* 👈 SHAPE_Length */;
  STATIC_BFE: number /* 👈 Static BFE */;
  VELOCITY: number /* 👈 VELOCITY */;
  VEL_UNIT: string /* 👈 VEL_UNIT */;
  V_DATUM: string /* 👈 V_DATUM */;
}

export interface LabelProperties {
  // 👇 original floodplain schema
  NAME: string;
  OBJECTID: string;
  // 👇 translated floodplain schema
  name: string;
  type: 'park' | 'stream';
}

export interface LakeProperties {
  county: string;
  name: string;
  town: string;
}

export interface Landmark
  extends GeoJSON.Feature<
    GeoJSON.Point | GeoJSON.MultiPoint | GeoJSON.LineString | GeoJSON.Polygon,
    LandmarkProperties
  > {
  $id?: string /* 👈 optional only because we'll complete it */;
  curated?: boolean;
  id: LandmarkID /* 👈 in Feature, also here just to remind us */;
  importHash?: string /* 👈 MD5 hash of GPX used in import */;
  owner: string;
  path: string;
}

export type Landmarks = GeoJSON.FeatureCollection<
  GeoJSON.Point | GeoJSON.MultiPoint | GeoJSON.LineString | GeoJSON.Polygon,
  LandmarkProperties
>;

export type LandmarkID = string;

export class LandmarkPropertiesClass {
  public fillColor: string = null;
  public fillOpacity = 0;
  public fillPattern: string = null /* 👈 should be OLFillPatternType */;
  public fillPatternAndColor = false;
  public fillPatternScale = 1;
  public fontColor: string = null;
  public fontFeet: number = null;
  public fontOpacity = 0;
  public fontOutline = false;
  public fontOutlineColor = null;
  public fontPixels: number = null;
  public fontSize: 'huge' | 'large' | 'medium' | 'small' | 'tiny' | null = null;
  public fontStyle: 'normal' | 'bold' | 'italic' | null = null;
  public iconColor: string = null;
  public iconOpacity = 0;
  public iconOutline = false;
  public iconOutlineColor = null;
  public iconSymbol: string = null;
  public lineChunk = false;
  public lineDash = [2, 1];
  public lineSpline = false;
  public metadata: Record<string, any> = null;
  public minWidth = 0;
  public minZoom = 0;
  public name: string = null;
  public orientation: number = null;
  public shadowColor: string = null;
  public shadowOffsetFeet: number[] = null;
  public shadowOpacity = 0;
  public showDimension = false;
  public strokeColor: string = null;
  public strokeFeet: number = null;
  public strokeOpacity = 0;
  public strokeOutline = false;
  public strokeOutlineColor = null;
  public strokePattern: string = null /* 👈 should be OLStrokePatternType */;
  public strokePatternScale = 1;
  public strokePixels: number = null;
  public strokeStyle: 'dashed' | 'solid' | null = null;
  public strokeWidth: 'thick' | 'medium' | 'thin' | null = null;
  public textAlign: 'left' | 'center' | 'right' | 'start' | 'end' | null = null;
  public textBaseline:
    | 'top'
    | 'middle'
    | 'bottom'
    | 'alphabetic'
    | 'hanging'
    | 'ideographic'
    | null = null;
  public textLocation: number[] = null;
  public textOffsetFeet: number[] = null;
  public textRotate = false;
  public zIndex = 0;
  constructor(opts?: LandmarkProperties) {
    Object.assign(this, opts ?? {});
  }
}

export interface LandmarkProperties extends Partial<LandmarkPropertiesClass> {}

const modelLandmark = new LandmarkPropertiesClass();

export const landmarkProperties = Object.keys(modelLandmark);

// 👉 Firebase doesn't alllow nested arrays, so we must serialize
//    and deserialize these properties

const serializedLandmarkProperties = Object.keys(modelLandmark).filter(
  (prop) => Array.isArray(modelLandmark[prop]) && modelLandmark[prop].length > 0
);

export interface LandmarkStyle {
  properties: LandmarkProperties[];
  styleDescription?: string;
  styleName: string;
}

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

export type CountableParcels = Partial<Parcels>;

export type SearchableParcels = Partial<Parcels>;

export type ParcelAction = 'added' | 'modified' | 'removed';

export type ParcelID = string | number;

// 👉 https://stackoverflow.com/questions/43909566

export class ParcelPropertiesClass {
  public abutters: string[] /* 👈 legacy support */ = [];
  public address = '';
  public addressOfOwner = '';
  public area = 0;
  public areas: number[] = [];
  public building$ = null;
  public callouts: number[][] /* 👈 legacy support */ = [[]];
  public centers: number[][] = [[]];
  public county = '';
  public elevations: number[] /* 👈 legacy support */ = [];
  public id: ParcelID = null;
  public labels: ParcelPropertiesLabel[] /* 👈 legacy support */ = [];
  public land$ = 0;
  public lengths: number[][] = [[]];
  public minWidths: number[] = [];
  public neighborhood: ParcelPropertiesNeighborhood = null;
  public orientations: number[] = [];
  public other$ = 0;
  public owner = '';
  public ownership: ParcelPropertiesOwnership = null;
  public perimeters: number[] = [];
  public sqarcities: number[] = [];
  public taxed$ = 0;
  public town = '';
  public usage: ParcelPropertiesUsage = null;
  public use: ParcelPropertiesUse = null;
  public zone = '';
  constructor(opts?: ParcelProperties) {
    Object.assign(this, opts ?? {});
  }
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

export const parcelPropertiesOwnership: Record<string, string> = {
  R: 'Resident',
  N: 'Non-resident',
  I: 'Institution',
  X: 'Unknown'
};

export type ParcelPropertiesOwnership = keyof typeof parcelPropertiesOwnership;

export const parcelPropertiesUsage: Record<string, string> = {
  '110': 'Single Family Residence',
  '120': 'Multi Family Residence',
  '130': 'Other Residential',
  '190': 'Current Use',
  '260': 'Commercial / Industrial',
  '300': 'Town Property',
  '400': 'State Property',
  '500': 'State Park',
  '501': 'Town Forest',
  '502': 'Conservation Land'
};

export type ParcelPropertiesUsage = keyof typeof parcelPropertiesUsage;

export const parcelPropertiesUse: Record<string, string> = {
  '': null,
  'CUWL': 'Wetland',
  'CUFL': 'Farmland',
  'CUMH': 'Managed Hardwood',
  'CUUH': 'Unmanaged Hardwood',
  'CUMW': 'Managed Pine',
  'CUUW': 'Unmanaged Pine',
  'CUMO': 'Managed (Other)',
  'CUUO': 'Unmanaged (Other)',
  'CUDE': 'Discretionary',
  'CUNS': 'Christmas Tree',
  'CUUL': 'Unproductive'
};

export type ParcelPropertiesUse = keyof typeof parcelPropertiesUse;

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
  // 👇 original railroads schema
  ABANDONMENT_YEAR: string /* 👈 Abandonment_Year */;
  CREATE_DATE: Date /* 👈 CREATE_DATE */;
  CREATE_USER: string /* 👈 CREATE_USER */;
  IS_PASSENGER: string /* 👈 IS_PASSENGER */;
  MP_END: number /* 👈 MP_END */;
  MP_START: number /* 👈 MP_START */;
  NAME: string /* 👈 RailroadName */;
  NAME_HISTORIC: string /* 👈 Historic_Line_Name */;
  NEEDS_CALIBRATION: string /* 👈 NEEDS_CALIBRATION */;
  OBJECTID: string /* 👈 OBJECTID */;
  OPERATOR: string /* 👈 Operator */;
  OWNERSHIP: string /* 👈 OWNERSHIP */;
  PARTS: number /* 👈 PARTS */;
  PURCHASE: string /* 👈 Purchase */;
  RRI: string /* 👈 RRI */;
  RRI_UID: number /* 👈 RRI_UID */;
  SECT_LENGTH: number /* 👈 Miles */;
  SHAPE_Length: number /* 👈 SHAPE_Length */;
  STATUS: string /* 👈 Status */;
  UPDT_DATE: Date /* 👈 UPDT_DATE */;
  UPDT_USER: string /* 👈 UPDT_USER */;
  // 👇 translated railroads schema
  active: boolean;
  name: string;
}

export interface RiverProperties {
  // 👇 original rivers schema
  FCode: number /* 👈 FCode */;
  FDate: Date /* 👈 FDate */;
  FType: number /* 👈 FType */;
  FlowDir: number /* 👈 FlowDir */;
  GNIS_ID: string /* 👈 GNIS_ID */;
  GNIS_Name: string /* 👈 GNIS_Name */;
  InNetwork: number /* 👈 InNetwork */;
  LengthKM: number /* 👈 LengthKM */;
  MainPath: number /* 👈 MainPath */;
  OBJECTID: string /* 👈 OBJECTID */;
  Permanent_Identifier: string /* 👈 Permanent_Identifier */;
  ReachCode: string /* 👈 ReachCode */;
  Resolution: number /* 👈 Resolution */;
  Shape_Length: number /* 👈 SHAPE_Length */;
  VisibilityFilter: number /* 👈 VisibilityFilter */;
  WBArea_Permanent_Identifier: string /* 👈 WBArea_Permanent_Identifier */;
  // 👇 translated rivers schema
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

export interface StreamCrossingProperties {
  // 👇 original streamcrossings schema
  AOP_Score: string /* 👈 98) AOP Compatibility Score */;
  ApproAngle: string /* 👈 16) Angle of Stream Flow Approach */;
  AssessDate: Date /* 👈 05) Assessment Date */;
  AssetType: string /* 👈 02) Asset Type */;
  ChanBFW1: number /* 👈 44) Channel - Bankfull Width 1 (ft) */;
  ChanBFW2: number /* 👈 45) Channel - Bankfull Width 2 (ft) */;
  ChanBFW3: number /* 👈 46) Channel - Bankfull Width 3 (ft) */;
  ChanDomSub: string /* 👈 47) Channel - Dominant Substrate */;
  Comments: string /* 👈 93) Comments */;
  CoverDepth: number /* 👈 53) Cover Depth (ft) */;
  CreationDa: Date /* 👈 CreationDa */;
  Creator: string /* 👈 Creator */;
  CrossConDs: string /* 👈 Crossing Condition - Outlet */;
  CrossConUs: string /* 👈 Crossing Condition - Inlet */;
  CrossSlope: string /* 👈 51) Structure Slope Compared to Channel Slope */;
  CrossType: string /* 👈 04) Crossing Type */;
  CulWatDep: number /* 👈 57) Water Depth - Structure Outlet (ft) */;
  DA_Acre: number /* 👈 Drainage Area (Acres) */;
  DA_Mile: number /* 👈 Drainage Area (Square Miles) */;
  DsBFW1: number /* 👈 82) Downstream - Bankful Width 1 (ft) */;
  DsBFW2: number /* 👈 83) Downstream - Bankful Width 2 (ft) */;
  DsBFW3: number /* 👈 84) Downstream - Bankful Width 3 (ft) */;
  DsBankArmo: string /* 👈 77) Downstream - Bank Armoring */;
  DsBankEros: string /* 👈 86) Downland usestream - Bank Erosion */;
  DsBankHigh: string /* 👈 87) DS Bank Heights Taller than US Banks */;
  DsBeavDam: string /* 👈 91) Downstream - Beaver Dam Near Structure */;
  DsBedrockP: string /* 👈 88) Downstream - Bedrock Present */;
  DsDomSub: string /* 👈 85) Downstream - Dominant Substrate */;
  DsHwCon: string /* 👈 70) Outlet Condition */;
  DsHwMat: string /* 👈 69) Outlet Headwall - Materials */;
  DsHydConDi: number /* 👈 90) Hydraulic Control Distance from Structure (ft) */;
  DsHydConTy: string /* 👈 89) Hydraulic Control Type */;
  DsInvElev: number /* 👈 55) Outlet Invert Elevation (ft) */;
  DsOpenHght: number /* 👈 61) Downstream - Open Height (B) (ft) */;
  DsPoolPres: string /* 👈 78) Downstream Pool Present */;
  DsTotHght: number /* 👈 63) Downstream - Total Height (D) (ft) */;
  DsUndermin: string /* 👈 71) Downstream - Scour Undermining Structure */;
  DsWatBody: string /* 👈 56) Downstream Waterbody */;
  DsWatDep: number /* 👈 81) Water Depth - Downstream Channel (ft) */;
  DsWetWidth: number /* 👈 62) Downstream - Wetted Width-Wall Rise (C) (ft) */;
  DsWidth: number /* 👈 60) Downstream - Width (A) (ft) */;
  DsWingwallMat: string /* 👈 68) Outlet Wingwall - Material */;
  EditDate: Date /* 👈 EditDate */;
  Editor: string /* 👈 Editor */;
  GC_Score: string /* 👈 99) Geomorphic Compatibility Score */;
  GUID_DES: string /* 👈 GUID_DES */;
  GlobalID_3: string /* 👈 GlobalID_3 */;
  HC_100yr: string /* 👈 104) Hydraulic Vulnerability - 100 Year */;
  HC_10yr: string /* 👈 101) Hydraulic Vulnerability- 10 Year */;
  HC_25yr: string /* 👈 102) Hydraulic Vulnerability - 25 Year */;
  HC_2yr: string /* 👈 100) Hydraulic Vulnerability - 2 Year */;
  HC_50yr: string /* 👈 103) Hydraulic Vulnerability - 50 Year */;
  HUC10: string /* 👈 HUC 10 */;
  InletType: string /* 👈 22) Inlet Type */;
  OBJECTID: string /* 👈 OBJECTID */;
  Observers: string /* 👈 07) Observers */;
  Organizat: string /* 👈 08) Organization */;
  OutGrade: string /* 👈 72) Outlet Water Profile */;
  OutScour: string /* 👈 76) Scour of Streambed at the Outlet */;
  OutTreat: string /* 👈 75) Outfall Treatment */;
  OutletDrop: number /* 👈 73) Outlet Drop (ft) */;
  OutletHeig: string /* 👈 74) Outlet Height from Streambed */;
  POINT_X: number /* 👈 POINT_X */;
  POINT_Y: number /* 👈 POINT_Y */;
  PoolDepEnt: number /* 👈 79) Water Depth at Flow Entry (ft) */;
  PoolDepMax: string /* 👈 80) Downstream Pool Maximum Depth (ft) */;
  ProjName: string /* 👈 09) Project Name */;
  QC_AOP_Status: string /* 👈 95) Current AOP QAQC Review Status */;
  QC_DesComs: string /* 👈 96) NHDES Review Comment */;
  QC_NHGS_Status: string /* 👈 95) Current NHGS status */;
  QC_ResCom: string /* 👈 97) Assessment Team Response Comment */;
  RoadNameA: string /* 👈 11) Road Name - Auto */;
  RoadNameF: string /* 👈 12) Road Name - Field */;
  SADES_ID: number /* 👈 01) SADES ID */;
  StrDomSub: string /* 👈 66) Dominant Substrate - Throughout Structure */;
  StrScreen: string /* 👈 31) Screening at Structure */;
  StreamName: string /* 👈 13) Stream Name */;
  StructCond: string /* 👈 65) Structure Condition */;
  StructLen: number /* 👈 58) Structure Length (ft) */;
  StructMat: string /* 👈 20) Structure Material */;
  StructNum: number /* 👈 17) Number of Structures at Crossing */;
  StructOver: string /* 👈 18) Overflow Structures Present */;
  StructSed: string /* 👈 67) Structure Filled with Sediment */;
  StructSkew: string /* 👈 14) Structure Skewed to Roadway */;
  StructSlop: number /* 👈 59) Structure Slope (%) */;
  StructType: string /* 👈 19) Structure Type */;
  Town: string /* 👈 10) Town */;
  USER_ID: string /* 👈 06) User ID */;
  UsBFW1: number /* 👈 37) Upstream - Bankfull Width 1 (ft) */;
  UsBFW2: number /* 👈 38) Upstream - Bankfull Width 2 (ft) */;
  UsBFW3: number /* 👈 39) Upstream - Bankfull Width 3 (ft) */;
  UsBankArmo: string /* 👈 35) Upstream - Bank Armoring */;
  UsBankEros: string /* 👈 43) Upstream - Bank Erosion */;
  UsBeavDam: string /* 👈 49) Upstream - Beaver Dam Near Structure */;
  UsDeposEle: string /* 👈 42) US Deposit Taller than 0.5 Bankfull Height */;
  UsDeposTyp: string /* 👈 41) Upstream Deposit Type */;
  UsDomSub: string /* 👈 40) Upstream - Dominant Substrate */;
  UsHwCon: string /* 👈 33) Inlet Condition */;
  UsHwMat: string /* 👈 32) Inlet Headwall - Materials */;
  UsInvElev: number /* 👈 54) Inlet Invert Elevation (ft) */;
  UsObstruct: string /* 👈 30) Structure Opening Mostly Obstructed */;
  UsOpenHght: number /* 👈 27) Upstream - Open Height (B) (ft) */;
  UsRoadElev: number /* 👈 52) Reference Elevation (ft) */;
  UsSteepSeg: string /* 👈 48) Steeper Segment within 1/3 mile Upstream */;
  UsTotHght: number /* 👈 29) Upstream - Total Height (D) (ft) */;
  UsUndermin: string /* 👈 34) Upstream - Scour Undermining Structure */;
  UsWatBody: string /* 👈 03) Upstream Waterbody */;
  UsWatDepth: number /* 👈 36) Water Depth - Upstream channel (ft) */;
  UsWetWidth: number /* 👈 28) Upstream - Wetted Width-Wall Rise (C) (ft) */;
  UsWidth: number /* 👈 26) Upstream - Width (A) (ft) */;
  UsWingwallMat: string /* 👈 23) Inlet Wingwall - Material */;
  Wildlife: string /* 👈 92) Wildlife observed - US, DS, Structure */;
  WingAngL: string /* 👈 24) Inlet Wingwall Angle - Stream Left */;
  WingAngR: string /* 👈 25) Inlet Wingwall Angle - Stream Right */;
  // 🔥 disambiguate bridges, culverts, flood hazards and stream crossings
  type: 'stream crossing';
}

export interface StoneWallProperties {
  // 👇 original stonewalls schema
  CreationDate: Date /* 👈 CreationDate */;
  Creator: string /* 👈 Creator */;
  EditDate: Date /* 👈 EditDate */;
  Editor: string /* 👈 Editor */;
  FEATURE_MAPPING_NOTES: string /* 👈 Feature Mapping Notes */;
  FEATURE_MAPPING_SOURCE: string /* 👈 Feature Mapping Source */;
  FEATURE_STATUS: string /* 👈 Feature Verification Status */;
  FEATURE_STATUS_SOURCE: string /* 👈 Feature Verification Status Source */;
  FEATURE_STATUS_SOURCE_2: number /* 👈 Feature Verification Status Source 2 */;
  FEATURE_TYPE: string /* 👈 Feature Type */;
  FEATURE_TYPOLOGY: string /* 👈 Feature Typology */;
  GENERAL_NOTES: string /* 👈 General Notes */;
  GlobalID: string /* 👈 GlobalID */;
  OBJECTID: string /* 👈 OBJECTID */;
  SCREENER_NAME: string /* 👈 Screener Name */;
  SYM_CODE: string /* 👈 Symbology Code */;
  Shape__Length: number /* 👈 Shape__Length */;
  TOWN: string /* 👈 City or Town */;
  USER_: string /* 👈 User name */;
  USER_EMAIL: string /* 👈 User email */;
  VERIFIER_NAME: string /* 👈 Verifier Name */;
}

export interface TrailProperties {
  county: string;
  name: string;
  system: string;
  town: string;
}

export interface WaterbodyProperties {
  // 👇 original waterbodies schema
  AreaSqKm: number /* 👈 AreaSqKm */;
  Elevation: number /* 👈 Elevation */;
  FCode: number /* 👈 FCode */;
  FDate: Date /* 👈 FDate */;
  FType: string /* 👈 FType */;
  GNIS_ID: string /* 👈 GNIS_ID */;
  GNIS_Name: string /* 👈 GNIS_Name */;
  OBJECTID: string /* 👈 OBJECTID */;
  Permanent_Identifier: string /* 👈 Permanent_Identifier */;
  ReachCode: string /* 👈 ReachCode */;
  Resolution: number /* 👈 Resolution */;
  Shape_Area: number /* 👈 SHAPE_Area */;
  Shape_Length: number /* 👈 SHAPE_Length */;
  VisibilityFilter: number /* 👈 VisibilityFilter */;
}

export interface WetlandProperties {
  // 👇 original wetland schema
  ACRES: number /* 👈 ACRES */;
  ATTRIBUTE: string /* 👈 ATTRIBUTE */;
  OBJECTID: string /* 👈 OBJECTID */;
  SHAPE_Leng: number /* 👈 SHAPE_Leng */;
  Shape_Area: number /* 👈 Shape_Area */;
  Shape_Length: number /* 👈 Shape_Length */;
  WETLAND_TY: string /* 👈 WETLAND_TY */;
  // 👇 translated wetland schema
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

export type HistoricalMap = {
  attribution: string;
  name: string;
  type: 'image' | 'xyz';
  url: string;
} & (HistoricalMapImage | HistoricalMapXYZ);

export type HistoricalMapImage = {
  center: [number, number];
  featherFilter?: string;
  featherWidth?: [number, Units];
  feathered?: boolean;
  filter?: string;
  masked: boolean;
  rotate: number;
  scale: [number, number];
  type: 'image';
};

export type HistoricalMapXYZ = {
  maxZoom: number;
  minZoom: number;
  type: 'xyz';
};

export type HistoricalMapIndex = Record<string, HistoricalMap[]>;

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
  if (x < y) console.error(`🔥 x(${x}) must be greater than y(${y})`);
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
  const [cx, cy] = bboxSize(minX, minY, maxX, maxY);
  // 👉 compare aspect ratios and pick best one
  const ar = cx / cy;
  // 👉 aspect ratio less than 1 means portrait
  //    but landscape is much better for large-scale printing,
  //    se we prefer it with a level of tolerance
  if (ar < 0.95) {
    const z = (cy * y) / x;
    // account for buffer
    const bx = b;
    const by = (b * x) / y;
    // can't make cx smaller!
    const dx = Math.max(cx - z, 0);
    const dy = (dx * x) / y;
    return bboxByDimensions(geojson, z + bx + dx, cy + by + dy);
  } else {
    // 👉 OK, must be landscape
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
  const [cx, cy] = bboxSize(minX, minY, maxX, maxY);
  // 👉 calculate amount of expansion needed
  const cxDelta = (cxDesired - cx) / 2;
  if (cxDelta < 0) console.error(`🔥 cx -ve ${cxDelta}`);
  const cyDelta = (cyDesired - cy) / 2;
  if (cyDelta < 0) console.error(`🔥 cy -ve ${cyDelta}`);
  // 👉 calculate new extremities
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

export function bboxSize(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  units: Units = 'kilometers'
): [number, number] {
  const cx = rhumbDistance([minX, minY], [maxX, minY], { units });
  const cy = rhumbDistance([minX, minY], [minX, maxY], { units });
  return [cx, cy];
}

export function calculateLandmark(landmark: Partial<Landmark>): void {
  if (landmark.geometry && landmark.geometry.type === 'Polygon') {
    const polygon = landmark as GeoJSON.Feature<GeoJSON.Polygon>;
    landmark.properties ??= {};
    landmark.properties.orientation = calculateOrientation(polygon);
    landmark.properties.minWidth = calculateMinWidth(
      polygon,
      landmark.properties.orientation
    );
    // 👇 note that we can edit text location
    if (!landmark.properties.textLocation)
      landmark.properties.textLocation = calculateCenter(polygon);
  }
}

export function calculateParcel(parcel: Partial<Parcel>): void {
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
    // 👉 bbox applies to the whole geometry
    parcel.bbox = bbox(parcel as any);
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
    parcel.properties ??= {};
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
  return convertArea(area(polygon), 'meters', 'acres');
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
    lengths.push(Math.round(length(lineString, { units: 'feet' })));
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
  return Math.round(distance(from, to, { units: 'feet' }));
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
  const perimeter = convertLength(
    lengths.reduce((sum, length) => sum + length),
    'feet',
    'meters'
  );
  return (area(polygon) / Math.pow(perimeter, 2)) * 4 * Math.PI;
}

export function dedupe(geojsons: Buildings[]): Buildings {
  const hash = geojsons.reduce((acc, geojson) => {
    geojson.features.forEach((feature) => (acc[feature.id] = feature));
    return acc;
  }, {});
  return featureCollection(Object.values(hash));
}

export function deserializeLandmark(landmark: Partial<Landmark>): void {
  if (landmark.geometry)
    landmark.geometry = JSON.parse(landmark.geometry as any);
  if (landmark.properties) {
    // 🔥 this may not be such a brilliant idea, as without an
    //    explicit property setting, we can't propery undo
    // landmarkProperties.forEach((prop) => {
    //   if (!landmark.properties[prop])
    //     landmark.properties[prop] = modelLandmark[prop];
    // });
    serializedLandmarkProperties.forEach((prop) => {
      if (landmark.properties[prop])
        landmark.properties[prop] = JSON.parse(landmark.properties[prop]);
    });
  }
}

export function deserializeParcel(parcel: Partial<Parcel>): void {
  if (parcel.geometry) parcel.geometry = JSON.parse(parcel.geometry as any);
  if (parcel.properties) {
    serializedParcelProperties.forEach((prop) => {
      if (parcel.properties[prop])
        parcel.properties[prop] = JSON.parse(parcel.properties[prop]);
    });
  }
}

export function isIndex(name: string): boolean {
  return /^[A-Z ]*$/.test(name);
}

// 🔥 the whole notion of "stolen" parcels to support multi-town
//    property maps is a possibly temporary hack, so we don't mind
//    for now the secret handshake that their parcel IDs are
//    wrapped in parentheses as in (12-4)

// 👉 yes, we really did mean to misspell "stollen"

export function isParcelStollen(id: ParcelID): boolean {
  return typeof id === 'string' && id.startsWith('(') && id.endsWith(')');
}

// 👇 we use this when landmarks are imported from an external source,
//    so that they don't get duplicated
export function makeLandmarkID(landmark: Partial<Landmark>): LandmarkID {
  return hash.MD5(landmark.geometry as any);
}

export function normalizeParcel(parcel: Partial<Parcel>): void {
  if (parcel.properties) {
    normalizeAddress(parcel);
    normalizeFld(parcel, 'addressOfOwner');
    normalizeFld(parcel, 'owner');
    normalizeOwnership(parcel);
  }
}

export function normalizeAddress(parcel: Partial<Parcel>): void {
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
    parcel.properties.address = normalized.replace(/ {2,}/g, ' ').trim();
  }
}

export function normalizeFld(parcel: Partial<Parcel>, fld: string): void {
  if (parcel.properties[fld]) {
    const normalized = parcel.properties[fld].trim().toUpperCase();
    parcel.properties[fld] = normalized;
  }
}

// 🔥 this only works for Washington!!
export function normalizeOwnership(parcel: Partial<Parcel>): void {
  if (parcel.properties.addressOfOwner) {
    if (
      ['300', '400', '500', '501', '502'].includes(parcel.properties.usage) ||
      parcel.properties.owner?.endsWith(' TC DEED') ||
      parcel.properties.owner?.endsWith(' TC - DEED')
    )
      parcel.properties.ownership = 'I';
    else if (
      parcel.properties.addressOfOwner.includes('03280') ||
      parcel.properties.addressOfOwner.includes('03244') ||
      parcel.properties.addressOfOwner.includes('03456')
    )
      parcel.properties.ownership = 'R';
    else parcel.properties.ownership = 'N';
  }
}

export function serializeLandmark(landmark: Partial<Landmark>): void {
  if (landmark.geometry)
    landmark.geometry = JSON.stringify(landmark.geometry) as any;
  if (landmark.properties) {
    if (landmark.properties instanceof LandmarkPropertiesClass)
      landmark.properties = { ...landmark.properties };
    // 🔥 this may not be such a brilliant idea, as without an
    //    explicit property setting, we can't propery undo
    // landmarkProperties.forEach((prop) => {
    //   if (landmark.properties[prop] === modelLandmark[prop])
    //     delete landmark.properties[prop];
    // });
    serializedLandmarkProperties.forEach((prop) => {
      if (landmark.properties[prop])
        landmark.properties[prop] = JSON.stringify(landmark.properties[prop]);
    });
  }
}

export function serializeParcel(parcel: Partial<Parcel>): void {
  if (parcel.geometry) parcel.geometry = JSON.stringify(parcel.geometry) as any;
  if (parcel.properties) {
    serializedParcelProperties.forEach((prop) => {
      if (parcel.properties[prop])
        parcel.properties[prop] = JSON.stringify(parcel.properties[prop]);
    });
  }
}

// 👉 trim all coordinates to 7 DP's
//    we used to use our own code, but now just use standard turf function
//    http://wiki.gis.com/wiki/index.php/Decimal_degrees
export function simplify(
  geojson: GeoJSON.FeatureCollection<any>
): GeoJSON.FeatureCollection<any> {
  return truncate(geojson, { precision: 7 });
}

export function timestampParcel(parcel: Partial<Parcel>): void {
  if (!parcel.timestamp) parcel.timestamp = serverTimestamp();
}
