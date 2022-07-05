import { DestroyService } from '../../services/destroy';
import { GeoJSONService } from '../../services/geojson';
import { MapableComponent } from '../ol-mapable';
import { OLControlAbstractParcelsLegendComponent } from '../ol-control-abstractparcelslegend';
import { OLMapComponent } from '../ol-map';
import { Parcel } from '../../common';
import { ParcelsState } from '../../state/parcels';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlParcelsLegendComponent)
    },
    DestroyService
  ],
  selector: 'app-ol-control-parcelslegend',
  templateUrl: './ol-control-parcelslegend.html',
  styleUrls: ['../ol-control-abstractparcelslegend.scss']
})
export class OLControlParcelsLegendComponent
  extends OLControlAbstractParcelsLegendComponent
  implements OnInit
{
  @Input() county: string;

  @Input() id: string;

  @ViewChild('legend', { static: true }) legend: ElementRef;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  @Input() printing: boolean;
  @Input() state: string;
  @Input() title: string;

  constructor(
    cdf: ChangeDetectorRef,
    destroy$: DestroyService,
    geoJSON: GeoJSONService,
    map: OLMapComponent,
    parcelsState: ParcelsState,
    route: ActivatedRoute
  ) {
    super(cdf, destroy$, geoJSON, map, parcelsState, route);
  }

  ngOnInit(): void {
    this.onInit();
  }
}
