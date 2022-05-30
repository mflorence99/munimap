import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Landmark } from '@lib/common';
import { LandmarkID } from '@lib/common';
import { MatDrawer } from '@angular/material/sidenav';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { SidebarComponent } from 'app/components/sidebar-component';
import { Store } from '@ngxs/store';
import { StreamCrossingProperties } from '@lib/common';
import { UpdateLandmark } from '@lib/state/landmarks';

import copy from 'fast-copy';
import OLFeature from 'ol/Feature';

// 🔥 only stream crossings are supported for now

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcel-properties',
  styleUrls: [
    './dpwlandmark-properties.scss',
    '../../../../../lib/css/sidebar.scss'
  ],
  templateUrl: './dpwlandmark-properties.html'
})
export class DPWLandmarkPropertiesComponent
  implements SidebarComponent, OnInit
{
  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  record: Partial<StreamCrossingProperties> = {};

  @Input() selectedIDs: LandmarkID[];

  constructor(private cdf: ChangeDetectorRef, private store: Store) {}

  #makeRecord(): void {
    this.record = copy(this.features[0].get('metadata'));
  }

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#makeRecord();
  }

  refresh(): void {
    this.#makeRecord();
    this.cdf.markForCheck();
  }

  save(record: Partial<StreamCrossingProperties>): void {
    const landmark: Partial<Landmark> = {
      id: this.features[0].getId() as string,
      properties: {
        metadata: record
      },
      type: 'Feature'
    };
    this.store.dispatch(new UpdateLandmark(landmark));
  }
}
