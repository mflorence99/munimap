import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { GeoJSONService } from '@lib/services/geojson';
import { MapState } from '@lib/state/map';
import { Observable } from 'rxjs';
import { OLControlAbstractParcelsLegendComponent } from '@lib/ol/ol-control-abstractparcelslegend';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/common';
import { ParcelsState } from '@lib/state/parcels';
import { Select } from '@ngxs/store';
import { VersionService } from '@lib/services/version';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-legend',
  styleUrls: ['./legend.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './legend.html'
})
export class ParcelsLegendComponent
  extends OLControlAbstractParcelsLegendComponent
  implements OnInit
{
  // 🔥 not used: only to satisfy base control
  county: string;
  id: string;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  // 🔥 not used: only to satisfy base control
  printing: boolean;
  state: string;
  title: string;

  constructor(
    cdf: ChangeDetectorRef,
    destroy$: DestroyService,
    geoJSON: GeoJSONService,
    mapState: MapState,
    parcelsState: ParcelsState,
    route: ActivatedRoute,
    private version: VersionService
  ) {
    // 🔥 not in map context
    super(cdf, destroy$, geoJSON, mapState, parcelsState, route);
  }

  ngOnInit(): void {
    this.onInit();
  }

  reset(): void {
    this.version.hardReset();
  }
}
