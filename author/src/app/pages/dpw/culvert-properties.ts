import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { CulvertProperties } from '@lib/common';
import { Input } from '@angular/core';
import { Landmark } from '@lib/common';
import { LandmarkID } from '@lib/common';
import { MatDrawer } from '@angular/material/sidenav';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { SidebarComponent } from 'app/components/sidebar-component';
import { Store } from '@ngxs/store';
import { UpdateLandmark } from '@lib/state/landmarks';

import { culvertConditions } from '@lib/common';
import { culvertFloodHazards } from '@lib/common';
import { culvertHeadwalls } from '@lib/common';
import { culvertMaterials } from '@lib/common';

import copy from 'fast-copy';
import OLFeature from 'ol/Feature';

// 🔥 only stream crossings are supported for now

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-culvert-properties',
  styleUrls: [
    './culvert-properties.scss',
    '../../../../../lib/css/sidebar.scss'
  ],
  templateUrl: './culvert-properties.html'
})
export class CulvertPropertiesComponent implements SidebarComponent, OnInit {
  allConditions = culvertConditions;
  allFloodHazards = culvertFloodHazards;
  allHeadwalls = culvertHeadwalls;
  allMaterials = culvertMaterials;

  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  record: Partial<CulvertProperties> = {};

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

  save(record: Partial<CulvertProperties>): void {
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
