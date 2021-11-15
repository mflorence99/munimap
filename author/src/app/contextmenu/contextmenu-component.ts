import { MatDrawer } from '@angular/material/sidenav';
import { OLMapComponent } from '@lib/ol/ol-map';
import { ParcelID } from '@lib/geojson';

import OLFeature from 'ol/Feature';

export interface ContextMenuComponent {
  drawer: MatDrawer;
  features: OLFeature<any>[];
  map: OLMapComponent;
  selectedIDs: ParcelID[];
}
