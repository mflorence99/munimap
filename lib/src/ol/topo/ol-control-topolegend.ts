import { DestroyService } from '../../services/destroy';
import { GeoJSONService } from '../../services/geojson';
import { Legend } from '../ol-control-abstractparcelslegend';
import { MapableComponent } from '../ol-mapable';
import { MapState } from '../../state/map';
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

import { convertArea } from '@turf/helpers';
import { forwardRef } from '@angular/core';

import area from '@turf/area';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlTopoLegendComponent)
    },
    DestroyService
  ],
  selector: 'app-ol-control-topolegend',
  templateUrl: './ol-control-topolegend.html',
  styleUrls: ['../ol-control-abstractparcelslegend.scss']
})
export class OLControlTopoLegendComponent
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

  areaOfTown: number;

  constructor(
    cdf: ChangeDetectorRef,
    destroy$: DestroyService,
    geoJSON: GeoJSONService,
    private map: OLMapComponent,
    mapState: MapState,
    parcelsState: ParcelsState,
    route: ActivatedRoute
  ) {
    super(cdf, destroy$, geoJSON, mapState, parcelsState, route);
    this.areaOfTown = convertArea(area(this.map.boundary), 'meters', 'acres');
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    this.olControl = new Legend({ element: this.legend.nativeElement });
    this.olControl.setProperties({ component: this }, true);
    this.onInit();
  }
}
