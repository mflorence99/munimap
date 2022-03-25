import { DestroyService } from '../../services/destroy';
import { GeoJSONService } from '../../services/geojson';
import { MapableComponent } from '../ol-mapable';
import { OLControlLegendComponent } from '../ol-control-legend';
import { OLMapComponent } from '../ol-map';
import { ParcelsState } from '../../state/parcels';
import { TypeRegistry } from '../../services/typeregistry';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlPropertyLegendComponent)
    },
    DestroyService
  ],
  selector: 'app-ol-control-propertylegend',
  templateUrl: './ol-control-propertylegend.html',
  styleUrls: ['../ol-control-legend.scss']
})
export class OLControlPropertyLegendComponent extends OLControlLegendComponent {
  constructor(
    cdf: ChangeDetectorRef,
    destroy$: DestroyService,
    geoJSON: GeoJSONService,
    map: OLMapComponent,
    parcelsState: ParcelsState,
    registry: TypeRegistry,
    route: ActivatedRoute
  ) {
    super(cdf, destroy$, geoJSON, map, parcelsState, registry, route);
  }
}
