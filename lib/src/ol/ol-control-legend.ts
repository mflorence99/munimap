import { Descriptor } from '../services/typeregistry';
import { DestroyService } from '../services/destroy';
import { Features } from '../geojson';
import { GeoJSONService } from '../services/geojson';
import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../geojson';
import { ParcelID } from '../geojson';
import { ParcelsState } from '../state/parcels';
import { TypeRegistry } from '../services/typeregistry';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Control as OLControl } from 'ol/control';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Subject } from 'rxjs';
import { ViewChild } from '@angular/core';

import { combineLatest } from 'rxjs';
import { forwardRef } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

import area from '@turf/area';
import copy from 'fast-copy';
import OLFillPattern from 'ol-ext/style/FillPattern';

class Legend extends OLControl {
  constructor(opts: any) {
    super(opts);
  }
}

interface Override {
  area?: number;
  usage?: string;
  use?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlLegendComponent)
    },
    DestroyService
  ],
  selector: 'app-ol-control-legend',
  templateUrl: './ol-control-legend.html',
  styleUrls: ['./ol-control-legend.scss']
})
export class OLControlLegendComponent implements Mapable, OnInit {
  #boundary$ = new Subject<Features>();
  #geojson$ = new Subject<Features>();

  areaByUsage: Record<string, number> = {};
  areaByUse: Record<string, number> = {};
  areaOfParcels: number;
  areaOfTown: number;

  @Input() county: string;

  // 👇 sucks we have to re-code these settings but they are approximations
  //    to the actual styles anyway, in order to contrast
  //    with a white background
  iconFloodplain = new OLFillPattern({ color: '#0d47a1', pattern: 'flooded' });
  iconPeatland = new OLFillPattern({
    color: '#1b5e20',
    pattern: 'scrub',
    scale: 0.66
  });
  iconWetland = new OLFillPattern({
    color: '#004d40',
    pattern: 'swamp',
    scale: 0.66
  });

  @Input() id: string;

  @ViewChild('legend', { static: true }) legend: ElementRef;

  olControl: OLControl;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  @Input() printing: boolean;
  @Input() state: string;
  @Input() title: string;

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private geoJSON: GeoJSONService,
    private map: OLMapComponent,
    private parcelsState: ParcelsState,
    public registry: TypeRegistry,
    private route: ActivatedRoute
  ) {}

  #filterRemovedFeatures(geojson: Features, parcels: Parcel[]): void {
    const removed = this.parcelsState.parcelsRemoved(parcels);
    geojson.features = geojson.features.filter(
      (feature) => !removed.has(feature.id)
    );
  }

  // 👉 the idea behind "countables" is to provide just enough data for
  //    parcels to be searched -- we do this because we MUST have ALL
  //    the data available -- so countables are degenerate parcels with
  //    just area, usage and use

  #handleBoundary$(): void {
    this.geoJSON
      .loadByIndex(this.route, this.map.path, 'boundary')
      .subscribe((boundary: Features) => this.#boundary$.next(boundary));
  }

  #handleGeoJSON$(): void {
    this.geoJSON
      .loadByIndex(this.route, this.map.path, 'countables')
      .subscribe((geojson: Features) => this.#geojson$.next(geojson));
  }

  #handleStreams$(): void {
    // 👇 we need to merge the incoming geojson with the latest parcels
    combineLatest([this.#boundary$, this.#geojson$, this.parcels$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([boundary, original, parcels]) => {
        // 👉 take a copy of the geojson before we change it
        const geojson = copy(original);
        // 👉 build aggregate data structures
        this.#insertAddedFeatures(geojson, parcels);
        this.#filterRemovedFeatures(geojson, parcels);
        const overridesByID = this.#makeOverridesByID(parcels);
        // 👉 aggregate area by usage
        this.areaByUsage = geojson.features.reduce((acc, feature) => {
          const override = overridesByID[feature.id];
          const area = override?.area ?? feature.properties.area;
          const usage = override?.usage ?? feature.properties.usage;
          if (!acc[usage]) acc[usage] = 0;
          acc[usage] += area;
          return acc;
        }, {});
        // 👉 aggregate area by use
        this.areaByUse = geojson.features.reduce((acc, feature) => {
          const override = overridesByID[feature.id];
          const area = override?.area ?? feature.properties.area;
          const use = override?.use ?? feature.properties.use;
          if (!acc[use]) acc[use] = 0;
          acc[use] += area;
          return acc;
        }, {});
        this.areaOfTown = area(boundary) * 0.000247105; /* 👈 to acres */
        this.areaOfParcels = Object.values(this.areaByUsage).reduce(
          (p, q) => p + q
        );
        this.cdf.markForCheck();
      });
  }

  #insertAddedFeatures(geojson: Features, parcels: Parcel[]): void {
    const added = this.parcelsState.parcelsAdded(parcels);
    // 👉 insert a model into the geojson (will be overwritten)
    added.forEach((id) => {
      geojson.features.push({
        geometry: undefined,
        id: id,
        properties: {},
        type: 'Feature'
      });
    });
  }

  #makeOverridesByID(parcels: Parcel[]): Record<ParcelID, Override> {
    const modified = this.parcelsState.parcelsModified(parcels);
    // 👉 merge all the modifications into a single override
    return Object.keys(modified).reduce((acc, id) => {
      const override: Override = {};
      modified[id].forEach((parcel) => {
        const props = parcel.properties;
        if (props) {
          ['area', 'usage', 'use'].forEach((prop) => {
            if (props[prop] !== undefined && override[prop] === undefined)
              override[prop] = props[prop];
          });
        }
      });
      acc[id] = override;
      return acc;
    }, {});
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }

  ngOnInit(): void {
    this.olControl = new Legend({ element: this.legend.nativeElement });
    this.#handleBoundary$();
    this.#handleGeoJSON$();
    this.#handleStreams$();
  }

  trackByUsage(ix: number, item: [any, Descriptor]): string {
    return item[0];
  }
}
