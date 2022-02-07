import { ContextMenuComponent } from './contextmenu-component';

import { AddParcels } from '@lib/state/parcels';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/geojson';
import { ParcelID } from '@lib/geojson';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { filter } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { toLonLat } from 'ol/proj';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import circle from '@turf/circle';
import OLFeature from 'ol/Feature';

interface Addition {
  area: number;
  id: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-add-parcel',
  styleUrls: ['./add-parcel.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './add-parcel.html'
})
export class AddParcelComponent implements ContextMenuComponent, OnInit {
  #contextMenuAt: number[];
  #hack: number;

  addition: Addition = {} as Addition;

  @ViewChild('additionForm', { static: true }) additionForm: NgForm;

  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @Input() selectedIDs: ParcelID[];

  constructor(
    private authState: AuthState,
    private destroy$: DestroyService,
    private store: Store
  ) {}

  // 👉 we need to know where the contextmenu was clicked so that later
  //    we can create a polygon around this center point

  #handleContextMenu$(): void {
    this.map.contextMenu$
      .pipe(
        takeUntil(this.destroy$),
        filter((event) => !!event)
      )
      .subscribe((event) => {
        this.#contextMenuAt = toLonLat(
          this.map.olMap.getCoordinateFromPixel([
            event.clientX,
            event.clientY - this.#hack
          ])
        );
      });
  }

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    // 👉 need to hack Y offsets by the height of the toolbar
    const style = getComputedStyle(document.documentElement);
    this.#hack = Number(style.getPropertyValue('--map-cy-toolbar'));
    this.#handleContextMenu$();
  }

  refresh(): void {}

  // 👇 the idea is that parcel addition is a two-part process
  //    first, right here, we insert a feature (arbitrarily square)
  //    then later the user will adjust the lot lines

  save(addition: Addition): void {
    // 👇 create a square centered on the context menu of area equal
    //    to the given area of the addition
    const r =
      Math.sqrt(addition.area * 43560 /* 👈 to sq ft */) /
      2 /* 👈 diameter to radius */ /
      5280; /* 👈 to miles */
    console.log(this.#contextMenuAt);
    const geojson = bboxPolygon(
      bbox(circle(this.#contextMenuAt, r, { steps: 16, units: 'miles' }))
    );
    // 👉 build the new parcel
    const addedParcel: Parcel = {
      action: 'added',
      geometry: geojson.geometry,
      id: addition.id,
      owner: this.authState.currentProfile().email,
      path: this.map.path,
      properties: {
        address: 'UNKNOWN',
        area: addition.area,
        county: this.map.path.split(':')[1],
        id: addition.id,
        neighborhood: '',
        owner: 'UNKNOWN',
        town: this.map.path.split(':')[2],
        usage: '110',
        use: '',
        zone: ''
      },
      type: 'Feature'
    };
    // that's it!
    this.store.dispatch(new AddParcels([addedParcel], 'fromMap'));
    this.drawer.close();
  }
}
