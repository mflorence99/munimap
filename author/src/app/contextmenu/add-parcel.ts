import { ContextMenuComponent } from './contextmenu-component';

import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { ParcelID } from '@lib/geojson';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';

interface Addition {
  area: number;
  id: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-parcel',
  styleUrls: ['./add-parcel.scss', '../pages/sidebar.scss'],
  templateUrl: './add-parcel.html'
})
export class AddParcelComponent implements ContextMenuComponent, OnInit {
  #format: OLGeoJSON;

  addition: Addition = {} as Addition;

  @ViewChild('additionForm', { static: true }) additionForm: NgForm;

  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @Input() selectedIDs: ParcelID[];

  constructor(private authState: AuthState, private store: Store) {}

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
  }

  refresh(): void {}

  // 👇 the idea is that parcel addition is a two-part process
  //    first, right here, we insert a feature (arbitrarily square)
  //    then later the user will adjust the lot lines

  save(addition: Addition): void {
    console.log(addition);
    // that's it!
    this.drawer.close();
  }
}
