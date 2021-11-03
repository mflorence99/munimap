import { AuthState } from '../state/auth';
import { ContextMenuComponent } from './contextmenu-component';
import { DestroyService } from '../services/destroy';
import { OLMapComponent } from '../ol/ol-map';
import { Parcel } from '../state/parcels';
import { ParcelProperties } from '../state/parcels';
import { ParcelsState } from '../state/parcels';

import { AngularFirestore } from '@angular/fire/firestore';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ValuesPipe } from 'ngx-pipes';
import { ViewChild } from '@angular/core';

import { takeUntil } from 'rxjs/operators';

import firebase from 'firebase/app';
import OLFeature from 'ol/Feature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService, ValuesPipe],
  selector: 'app-merge-parcels',
  styleUrls: ['./contextmenu-component.scss', './merge-parcels.scss'],
  templateUrl: './merge-parcels.html'
})
export class MergeParcelsComponent implements ContextMenuComponent, OnInit {
  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @Select(ParcelsState) parcels$: Observable<Parcel[]>;

  @Input() selectedIDs: string[];

  constructor(
    private authState: AuthState,
    private destroy$: DestroyService,
    private firestore: AngularFirestore,
    private parcelsState: ParcelsState
  ) {}

  #handleParcels$(): void {
    this.parcels$.pipe(takeUntil(this.destroy$)).subscribe(console.log);
  }

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#handleParcels$();
  }
}
