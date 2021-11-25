import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLStyle from 'ol/style/Style';

// 👇 https://stackoverflow.com/questions/27522973
export interface OLStyleComponent {
  style: () => OLStyleFunction | OLStyle | OLStyle[];
  styleWhenSelected?: () => OLStyleFunction | OLStyle | OLStyle[];
}

export type OLFillPatternType =
  | 'breccia'
  | 'brick'
  | 'caps'
  | 'cemetry'
  | 'chaos'
  | 'circle'
  | 'clay'
  | 'coal'
  | 'conglomerate'
  | 'conglomerate2'
  | 'cross'
  | 'crosses'
  | 'dolomite'
  | 'dot'
  | 'flooded'
  | 'forest'
  | 'forest2'
  | 'grass'
  | 'gravel'
  | 'hatch'
  | 'hexagon'
  | 'mixtree'
  | 'mixtree2'
  | 'nylon'
  | 'pine'
  | 'pines'
  | 'reed'
  | 'rock'
  | 'rocks'
  | 'sand'
  | 'scrub'
  | 'square'
  | 'swamp'
  | 'tile'
  | 'tree'
  | 'vine'
  | 'wave'
  | 'woven';

export type OLStrokePatternType = OLFillPatternType;
