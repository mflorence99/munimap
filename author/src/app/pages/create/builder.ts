import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { GeoJSONService } from '@lib/services/geojson';
import { Index } from '@lib/common';
import { Input } from '@angular/core';
import { Output } from '@angular/core';
import { Path } from '@lib/state/view';
import { TownIndex } from '@lib/common';

import { inject } from '@angular/core';
import { isIndex } from '@lib/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-builder',
  template: `
    <mat-card appearance="outlined" class="card">
      <mat-card-header>
        <img src="assets/favicon.svg" mat-card-avatar />
        <mat-card-title>Create a New Map</mat-card-title>
        <mat-card-subtitle>
          Use map or dropdowns to drill down to a town
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form
          #filterForm="ngForm"
          (submit)="submit()"
          autocomplete="off"
          class="form"
          id="filterForm"
          novalidate
          spellcheck="false">
          <mat-form-field>
            <mat-label>Select Map Type</mat-label>
            <mat-select
              [appAutoFocus]="true"
              (selectionChange)="switchType($event.value)"
              [disabled]="currentTown()"
              [value]="currentType()">
              <mat-option value="parcels">Parcels</mat-option>
              <mat-option value="topo">Topographic</mat-option>
              <mat-option value="dpw">DPW</mat-option>
              <mat-option value="night">Nighttime</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Select a County</mat-label>
            <mat-select
              (selectionChange)="switchCounty($event.value)"
              [value]="currentCounty()">
              @for (county of allCounties(); track county) {
                <mat-option [value]="county">{{ county }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Select a Town</mat-label>
            <mat-select
              (selectionChange)="switchTown($event.value)"
              [value]="currentTown()">
              @for (town of allTowns(); track town) {
                <mat-option [value]="town">{{ town }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </form>
      </mat-card-content>

      <mat-card-actions class="actions">
        @if (currentCounty()) {
          <a (click)="reset()" mat-flat-button>Start Over</a>
        }

        <div class="filler"></div>

        <button
          [disabled]="!currentTown()"
          color="primary"
          form="filterForm"
          mat-flat-button
          type="submit">
          NEXT
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      :host {
        pointer-events: auto;
      }

      .actions {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        justify-content: flex-end;
        padding: 16px;
      }

      .card {
        width: 30rem;
      }

      .filler {
        flex-grow: 1;
      }

      .form {
        display: grid;
        gap: 1rem;
      }
    `
  ]
})
export class BuilderComponent {
  @Input() path: Path;

  @Output() pathChanged = new EventEmitter<Path>();
  @Output() pathSelected = new EventEmitter<Path>();

  @Input() type: string;

  @Output() typeChanged = new EventEmitter<string>();

  index: Index;

  #geoJSON = inject(GeoJSONService);
  #route = inject(ActivatedRoute);

  constructor() {
    this.index = this.#geoJSON.findIndex(this.#route);
  }

  allCounties(): string[] {
    const state = this.currentState();
    return Object.keys(this.index[state]).filter(isIndex).sort();
  }

  allStates(): string[] {
    return Object.keys(this.index).filter(isIndex).sort();
  }

  allTowns(): string[] {
    const state = this.currentState();
    const county = this.currentCounty();
    return (
      Object.keys(this.index[state][county] ?? {})
        .filter(isIndex)
        // 👉 parcels MUST be available for parcels map
        .filter((town) => {
          const townIndex = this.index[state][county][town] as TownIndex;
          return this.type !== 'parcels' || townIndex.layers.parcels.available;
        })
        .sort()
    );
  }

  currentCounty(): string {
    return this.path?.split(':')[1];
  }

  currentState(): string {
    return this.path?.split(':')[0];
  }

  currentTown(): string {
    return this.path?.split(':')[2];
  }

  currentType(): string {
    return this.type;
  }

  reset(): void {
    this.pathChanged.emit(this.currentState());
  }

  submit(): void {
    this.pathSelected.emit(this.path);
  }

  switchCounty(county: string): void {
    this.pathChanged.emit(`${this.currentState()}:${county}`);
  }

  switchState(state: string): void {
    this.pathChanged.emit(`${state}`);
  }

  switchTown(town: string): void {
    this.pathChanged.emit(
      `${this.currentState()}:${this.currentCounty()}:${town}`
    );
  }

  switchType(type: string): void {
    this.type = type;
    this.typeChanged.emit(this.currentType());
  }
}
