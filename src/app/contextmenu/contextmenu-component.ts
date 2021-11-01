import OLFeature from 'ol/Feature';

export interface ContextMenuComponent {
  features: OLFeature<any>[];
  path: string;
  selectedIDs: string[];
}
