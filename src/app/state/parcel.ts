export interface Parcel {
  abutters: string[];
  address: string;
  area: number;
  areaComputed: number;
  building$: number;
  cu$: number;
  elevation: number;
  id: string;
  // 👉 legacy support
  label?: { rotate: boolean; split: boolean };
  land$: number;
  lengths: number[];
  minWidth: number;
  neighborhood: 'U' | 'V' | 'W';
  orientation: number;
  owner: string;
  perimeter: number;
  sqarcity: number;
  taxed$: number;
  usage: '110' | '120' | '190' | '260' | '300' | '400' | '500' | '501' | '502';
  use: 'CUFL' | 'CUMH' | 'CUMW' | 'CUUH' | 'CUUW' | 'CUWL';
  zone: string;
}
