import { OLMapComponent } from '../ol/ol-map';

import { MatDrawer } from '@angular/material/sidenav';

import OLFeature from 'ol/Feature';

export interface ContextMenuComponent {
  drawer: MatDrawer;
  features: OLFeature<any>[];
  map: OLMapComponent;
  selectedIDs: string[];
}
