import { MatDrawer } from "@angular/material/sidenav";
import { OLMapComponent } from "@lib/ol/ol-map";

import OLFeature from "ol/Feature";

export interface SidebarComponent {
  drawer: MatDrawer;
  features: OLFeature<any>[];
  map: OLMapComponent;
  selectedIDs: (string | number)[];

  refresh(): void;
}
