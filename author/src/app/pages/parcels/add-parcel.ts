import { SidebarComponent } from '../../components/sidebar-component';

import { AddParcels } from '@lib/state/parcels';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { Parcel } from '@lib/common';
import { ParcelID } from '@lib/common';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { convertArea } from '@turf/helpers';
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
  selector: 'app-add-parcel',
  styleUrls: ['./add-parcel.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './add-parcel.html'
})
export class AddParcelComponent implements SidebarComponent {
  @ViewChild('additionForm') additionForm: NgForm;

  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @Input() selectedIDs: ParcelID[];

  addition: Addition = {} as Addition;

  constructor(private authState: AuthState, private store: Store) {}

  cancel(): void {
    this.drawer.close();
  }

  refresh(): void {}

  // 👇 the idea is that parcel addition is a two-part process
  //    first, right here, we insert a feature (arbitrarily square)
  //    then later the user will adjust the lot lines

  save(addition: Addition): void {
    // 👇 create a square centered on the context menu of area equal
    //    to the given area of the addition
    const diameter = Math.sqrt(convertArea(addition.area, 'acres', 'miles'));
    const geojson = bboxPolygon(
      bbox(
        circle(toLonLat(this.map.contextMenuAt), diameter / 2, {
          steps: 16,
          units: 'miles'
        })
      )
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
    this.store.dispatch(new AddParcels([addedParcel]));
    this.drawer.close();
  }
}
