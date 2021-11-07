import { AuthState } from '../state/auth';
import { ContextMenuComponent } from './contextmenu-component';
import { OLMapComponent } from '../ol/ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import OLFeature from 'ol/Feature';

interface Subdivision {
  area: number;
  id: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-subdivide-parcels',
  styleUrls: ['./contextmenu-component.scss', './subdivide-parcel.scss'],
  templateUrl: './subdivide-parcel.html'
})
export class SubdivideParcelComponent implements ContextMenuComponent {
  #features: OLFeature<any>[];

  @Input() drawer: MatDrawer;

  @Input()
  get features(): OLFeature<any>[] {
    return this.#features;
  }
  set features(features: OLFeature<any>[]) {
    this.#features = features;
    this.subdivisions = [
      {
        area: this.features[0].getProperties().area,
        id: `${this.features[0].getId()}`
      },
      {
        area: null,
        id: null
      }
    ];
  }

  @Input() map: OLMapComponent;

  @Input() selectedIDs: string[];

  @ViewChild('subdivisionForm', { static: true }) subdivisionForm: NgForm;

  subdivisions: Subdivision[];

  constructor(private authState: AuthState, private store: Store) {}

  cancel(): void {
    this.drawer.close();
  }

  more(): void {
    this.subdivisions.push({ area: null, id: null });
  }

  save(subdivisions: Subdivision[]): void {
    this.drawer.close();
  }
}
