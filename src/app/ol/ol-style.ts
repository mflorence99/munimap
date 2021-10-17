import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

// 👇 https://stackoverflow.com/questions/27522973
export interface OLStyleComponent {
  style: () => OLStyleFunction;
  styleWhenSelected?: () => OLStyleFunction;
}
