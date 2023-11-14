import { SidebarComponent } from '../../components/sidebar-component';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Landmark } from '@lib/common';
import { LandmarkID } from '@lib/common';
import { LandmarkProperties } from '@lib/common';
import { MatDrawer } from '@angular/material/sidenav';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { UpdateLandmark } from '@lib/state/landmarks';

import { landmarkProperties } from '@lib/common';

import copy from 'fast-copy';
import OLFeature from 'ol/Feature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-landmark-properties',
  template: `
    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'tasks']" size="2x"></fa-icon>
      </figure>

      <p class="title">Modify landmark settings</p>
      <p class="subtitle">
        Use the
        <fa-icon [icon]="['fad', 'undo']"></fa-icon>
        tool to reverse any changes
      </p>
    </header>

    <form
      #propertiesForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="save(record)"
      autocomplete="off"
      class="form"
      id="propertiesForm"
      novalidate
      spellcheck="false">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input
          #name="ngModel"
          [(ngModel)]="record.name"
          [appSelectOnFocus]="true"
          autocomplete="off"
          matInput
          name="name" />
      </mat-form-field>

      @if (['LineString', 'Polygon'].includes(geometryType)) {
        <mat-checkbox [(ngModel)]="record.showDimension" name="showDimension">
          Show dimension
        </mat-checkbox>
      }
    </form>

    <article class="actions">
      <button (click)="cancel()" mat-flat-button>DONE</button>

      <button
        [disabled]="!propertiesForm.dirty"
        color="primary"
        form="propertiesForm"
        mat-flat-button
        type="submit">
        SAVE
      </button>
    </article>
  `,
  styleUrls: ['../../../../../lib/css/sidebar.scss']
})
export class LandmarkPropertiesComponent implements SidebarComponent, OnInit {
  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @Input() selectedIDs: LandmarkID[];

  geometryType: string;

  record: Partial<LandmarkProperties> = {};

  constructor(
    private cdf: ChangeDetectorRef,
    private store: Store
  ) {}

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

  save(record: Partial<LandmarkProperties>): void {
    const landmark: Partial<Landmark> = {
      id: this.features[0].getId() as string,
      properties: record,
      type: 'Feature'
    };
    this.store.dispatch(new UpdateLandmark(landmark));
  }

  #makeRecord(): void {
    // 👇 extract geometry type
    this.geometryType = this.features[0].getGeometry().getType();
    // 👇 extract ONLY the landmark properties
    const base = copy(this.features[0].getProperties());
    this.record = landmarkProperties.reduce((acc, nm) => {
      acc[nm] = base[nm] ?? null;
      return acc;
    }, {});
    // 👇 make sure there's metadata
    this.record.metadata ??= {};
  }
}
