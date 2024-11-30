import { SidebarComponent } from '../../components/sidebar-component';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { CulvertProperties } from '@lib/common';
import { Landmark } from '@lib/common';
import { LandmarkID } from '@lib/common';
import { LandmarksActions } from '@lib/state/landmarks';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';

import { culvertConditions } from '@lib/common';
import { culvertFloodHazards } from '@lib/common';
import { culvertHeadwalls } from '@lib/common';
import { culvertMaterials } from '@lib/common';
import { inject } from '@angular/core';
import { viewChild } from '@angular/core';

import copy from 'fast-copy';
import OLFeature from 'ol/Feature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-culvert-properties',
  template: `
    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'tasks']" size="2x"></fa-icon>
      </figure>

      <p class="title">Modify {{ record.type }} settings</p>
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
      class="form two-column"
      id="propertiesForm"
      novalidate
      spellcheck="false"
      style="grid-template-rows: repeat(6, auto)">
      <mat-form-field style="grid-column: 1/3">
        <mat-label>Location</mat-label>
        <input
          #diameter="ngModel"
          [(ngModel)]="record.location"
          [appSelectOnFocus]="true"
          autocomplete="off"
          matInput
          name="location"
          required
          type="text" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Description</mat-label>
        <textarea
          #description="ngModel"
          [(ngModel)]="record.description"
          [appSelectOnFocus]="true"
          autocomplete="off"
          matInput
          name="description"
          rows="2"></textarea>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Material</mat-label>
        <mat-select
          #material="ngModel"
          [(ngModel)]="record.material"
          name="material"
          required>
          @for (material of allMaterials; track material) {
            <mat-option [value]="material">{{ material }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Condition</mat-label>
        <mat-select
          #condition="ngModel"
          [(ngModel)]="record.condition"
          name="condition"
          required>
          @for (condition of allConditions; track condition) {
            <mat-option [value]="condition">{{ condition }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Headwall</mat-label>
        <mat-select
          #headwall="ngModel"
          [(ngModel)]="record.headwall"
          name="headwall"
          required>
          @for (headwall of allHeadwalls; track headwall) {
            <mat-option [value]="headwall">{{ headwall }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Flood Hazard</mat-label>
        <mat-select
          #floodHazard="ngModel"
          [(ngModel)]="record.floodHazard"
          name="floodHazard"
          required>
          @for (floodHazard of allFloodHazards; track floodHazard) {
            <mat-option [value]="floodHazard">{{ floodHazard }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <article>
        <mat-radio-group
          (change)="shape = $event.value"
          [value]="shape"
          class="field two-column">
          <mat-radio-button value="circular">Circular</mat-radio-button>
          <mat-radio-button value="elliptical">Elliptical</mat-radio-button>
        </mat-radio-group>

        @if (shape === 'circular') {
          <mat-form-field class="field">
            <mat-label>Diameter (inches)</mat-label>
            <input
              #diameter="ngModel"
              [(ngModel)]="record.diameter"
              [step]="1"
              autocomplete="off"
              matInput
              name="diameter"
              required
              type="number" />
          </mat-form-field>
        }

        @if (shape === 'elliptical') {
          <article class="field two-column">
            <mat-form-field>
              <mat-label>Width (inches)</mat-label>
              <input
                #diameter="ngModel"
                [(ngModel)]="record.width"
                [step]="1"
                autocomplete="off"
                matInput
                name="width"
                required
                type="number" />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Height (inches)</mat-label>
              <input
                #diameter="ngModel"
                [(ngModel)]="record.height"
                [step]="1"
                autocomplete="off"
                matInput
                name="height"
                required
                type="number" />
            </mat-form-field>
          </article>
        }
      </article>

      <mat-form-field>
        <mat-label>Length (feet)</mat-label>
        <input
          #length="ngModel"
          [(ngModel)]="record.length"
          [step]="1"
          autocomplete="off"
          matInput
          name="length"
          required
          type="number" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Count (eg: 2 for double)</mat-label>
        <input
          #length="ngModel"
          [(ngModel)]="record.count"
          [step]="1"
          autocomplete="off"
          matInput
          name="count"
          required
          type="number" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Year Built/Reconstructed</mat-label>
        <input
          #diameter="ngModel"
          [(ngModel)]="record.year"
          [step]="1"
          autocomplete="off"
          matInput
          name="year"
          type="number" />
      </mat-form-field>
    </form>

    <article class="actions">
      <button (click)="cancel()" mat-flat-button>Done</button>

      <button
        [disabled]="!propertiesForm.dirty"
        color="primary"
        form="propertiesForm"
        mat-flat-button
        type="submit">
        Save
      </button>
    </article>
  `,
  standalone: false
})
export class CulvertPropertiesComponent implements SidebarComponent, OnInit {
  allConditions = culvertConditions;
  allFloodHazards = culvertFloodHazards;
  allHeadwalls = culvertHeadwalls;
  allMaterials = culvertMaterials;
  drawer: MatDrawer;
  features: OLFeature<any>[];
  map: OLMapComponent;
  ngForm = viewChild<NgForm>('propertiesForm');
  record: Partial<CulvertProperties> = {};
  selectedIDs: LandmarkID[];
  shape: 'circular' | 'elliptical';

  #cdf = inject(ChangeDetectorRef);
  #store = inject(Store);

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#makeRecord();
  }

  refresh(): void {
    this.#makeRecord();
    this.#cdf.markForCheck();
  }

  save(record: Partial<CulvertProperties>): void {
    if (this.shape === 'circular') record.height = record.width = 0;
    else if (this.shape === 'elliptical') record.diameter = 0;
    const landmark: Partial<Landmark> = {
      id: this.features[0].getId() as string,
      properties: {
        metadata: record
      },
      type: 'Feature'
    };
    this.#store.dispatch(new LandmarksActions.UpdateLandmark(landmark));
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.ngForm().form.markAsPristine();
  }

  #makeRecord(): void {
    this.record = copy(this.features[0].get('metadata'));
    if (this.record.diameter > 0) this.shape = 'circular';
    if (this.record.width > 0 && this.record.height > 0)
      this.shape = 'elliptical';
  }
}
