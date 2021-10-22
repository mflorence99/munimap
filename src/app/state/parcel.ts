export interface Parcel {
  abutters?: string[];
  address?: string;
  area: number;
  areaComputed: number;
  building$?: number;
  callout?: number[] /* 👈 legacy support */;
  center?: number[] /* 👈 legacy support */;
  class: string;
  county: string;
  cu$?: number /* 👈 should be feature!! */;
  elevation?: number;
  id: string;
  label?: { rotate: boolean; split: boolean } /* 👈 legacy support */;
  land$?: number;
  lengths?: number[];
  minWidth?: number;
  neighborhood?: 'U' | 'V' | 'W';
  numSplits: number;
  orientation?: number;
  owner?: string;
  perimeter?: number;
  sqarcity?: number;
  taxed$?: number;
  town: string;
  usage:
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
  use?:
    | 'CUDE' // Discretionary
    | 'CUFL' // Farm land
    | 'CUMH' // Managed hardwood
    | 'CUMO' // Managesd other
    | 'CUMW' // Managed pine
    | 'CUNS' // Xmas tree
    | 'CUUH' // Unmanaged hardwood
    | 'CUUL' // Unproductive
    | 'CUUO' // Unm,anaged other
    | 'CUUW' // Unmanaged pine
    | 'CUWL'; // Wetland
  zone: string;
}
