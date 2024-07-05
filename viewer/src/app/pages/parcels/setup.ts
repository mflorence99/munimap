import { ChangeDetectionStrategy } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";
import { MatDrawer } from "@angular/material/sidenav";
import { DestroyService } from "@lib/services/destroy";
import { HistoricalsService } from "@lib/services/historicals";
import { ViewActions } from "@lib/state/view";
import { ViewState } from "@lib/state/view";
import { ViewStateModel } from "@lib/state/view";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";

import { inject } from "@angular/core";
import { satelliteYears } from "@lib/ol/ol-source-satellite";
import { takeUntil } from "rxjs/operators";

import copy from "fast-copy";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-parcels-setup",
  template: `
    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fas', 'cog']" size="2x"></fa-icon>
      </figure>

      <p class="title">Configure parcel map</p>
      <p class="subtitle">Parcel map layout and color-coding</p>
    </header>

    <form
      #setupForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="save(record)"
      autocomplete="off"
      class="form"
      id="setupForm"
      novalidate
      spellcheck="false">
      @if (record.satelliteView) {
        <p>
          A selection of historical views may be displayed side-by-side with
          present-day satellite data.
        </p>

        <mat-form-field>
          <mat-label>Select Side-by-side Source</mat-label>
          <mat-select [(ngModel)]="record.satelliteYear" name="satelliteYear">
            @for (year of satelliteYears; track year) {
              <mat-option [value]="year">
                @if (year) {
                  {{ year }} satellite data
                } @else {
                  No side-by-side comparison
                }
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      @if (!record.satelliteView) {
        <p class="instructions">
          Consult the
          <em>legend</em>
          in the left sidebar for the key to the color-coding. Codings marked
          <sup>[1]</sup>
          are experimental. Contact
          <a href="mailto:munimap.helpdesk@gmail.com" target="_blank">
            munimap&#8203;.helpdesk&#8203;&#64;gmail.com
          </a>
          with questions or suggestions.
        </p>

        <mat-radio-group
          [(ngModel)]="record.parcelCoding"
          class="list"
          name="parcelCoding"
          required>
          <mat-radio-button value="usage">Show land use</mat-radio-button>
          <mat-radio-button value="ownership">
            Show ownership
            <sup>[1]</sup>
          </mat-radio-button>
          <mat-radio-button value="conformity">
            Show conformity
            <sup>[1]</sup>
          </mat-radio-button>
          <mat-radio-button value="topography">
            Show topography
          </mat-radio-button>
          <mat-radio-button value="history">
            Show historical map
          </mat-radio-button>
        </mat-radio-group>

        @if (record.parcelCoding === 'history') {
          <mat-form-field>
            <mat-label>Select Historical Map</mat-label>
            <mat-select
              [(ngModel)]="record.historicalMapLeft"
              name="historicalMapLeft">
              @for (map of historicalMaps; track map) {
                @if (map) {
                  <mat-option [value]="map">
                    {{ map }}
                  </mat-option>
                }
              }
            </mat-select>
          </mat-form-field>
        }

        <p class="instructions">
          Historical maps may be displayed side-by-side for comparison.
        </p>

        <mat-form-field>
          <mat-label>Select Side-by-side Source</mat-label>
          <mat-select
            [(ngModel)]="record.historicalMapRight"
            name="historicalMapRight">
            @for (map of historicalMaps; track map) {
              <mat-option [value]="map">
                @if (map) {
                  {{ map }}
                } @else {
                  No side-by-side comparison
                }
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
    </form>

    <article class="actions">
      <button (click)="cancel()" mat-flat-button>CANCEL</button>

      <button
        [disabled]="!setupForm.dirty"
        color="primary"
        form="setupForm"
        mat-flat-button
        type="submit">
        SAVE
      </button>
    </article>
  `,
})
export class ParcelsSetupComponent implements OnInit {
  record: Partial<ViewStateModel> = {
    historicalMapLeft: "",
    historicalMapRight: "",
    parcelCoding: "usage",
    recentPath: "",
    satelliteYear: "",
  };

  view$: Observable<ViewStateModel>;

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #drawer = inject(MatDrawer);
  #historicals = inject(HistoricalsService);
  #store = inject(Store);

  constructor() {
    this.view$ = this.#store.select(ViewState.view);
  }

  get historicalMaps(): string[] {
    return [
      "",
      ...this.#historicals
        .historicalsFor(this.record.recentPath)
        .map((historical) => historical.name)
        .sort()
        .reverse(),
    ];
  }

  get satelliteYears(): string[] {
    return ["", ...satelliteYears.slice().reverse()];
  }

  cancel(): void {
    this.#drawer.close();
  }

  ngOnInit(): void {
    this.#handleSetup$();
  }

  save(record: Partial<ViewStateModel>): void {
    if (record.satelliteView)
      this.#store.dispatch(
        new ViewActions.SetSatelliteYear(record.satelliteYear),
      );
    else
      this.#store.dispatch([
        new ViewActions.SetParcelCoding(record.parcelCoding),
        new ViewActions.SetHistoricalMapLeft(record.historicalMapLeft),
        new ViewActions.SetHistoricalMapRight(record.historicalMapRight),
      ]);

    this.#store.dispatch(
      new ViewActions.SetSideBySideView(
        (record.satelliteView && !!record.satelliteYear) ||
          (!record.satelliteView && !!record.historicalMapRight),
      ),
    );
    this.#drawer.close();
  }

  #handleSetup$(): void {
    this.view$.pipe(takeUntil(this.#destroy$)).subscribe((view) => {
      this.record = copy(view);
      // 👇 use the last historical map if none set
      this.record.historicalMapLeft ??= this.historicalMaps.at(-1);
      this.#cdf.markForCheck();
    });
  }
}
