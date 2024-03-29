import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { SetParcelCoding } from '@lib/state/view';
import { SetSatelliteYear } from '@lib/state/view';
import { SetSideBySideView } from '@lib/state/view';
import { Store } from '@ngxs/store';
import { ViewState } from '@lib/state/view';
import { ViewStateModel } from '@lib/state/view';

import { inject } from '@angular/core';
import { satelliteYears } from '@lib/ol/ol-source-satellite';
import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-setup',
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
      <p class="instructions">
        Consult the
        <em>legend</em>
        in the left sidebar for the key to the color-coding.
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
        <mat-radio-button value="topography">Show topography</mat-radio-button>
      </mat-radio-group>

      <p class="instructions">
        <sup>[1]</sup>
        These color-codings are experimental. Contact
        <a href="mailto:munimap.helpdesk@gmail.com" target="_blank">
          munimap.helpdesk&#64;gmail.com
        </a>
        with questions or suggestions.
      </p>

      <mat-form-field>
        <mat-label>Select Side-by-side Source</mat-label>
        <mat-select [(ngModel)]="record.satelliteYear" name="satelliteYear">
          <mat-option [value]="null">No side-by-side comparison</mat-option>
          @for (year of satelliteYears; track year) {
            <mat-option [value]="year">
              @if (year) {
                {{ year }} satellite data
              } @else {
                Latest satellite data
              }
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
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
  `
})
export class ParcelsSetupComponent implements OnInit {
  @Select(ViewState) view$: Observable<ViewStateModel>;

  record: Partial<ViewStateModel> = {
    parcelCoding: 'usage',
    satelliteYear: ''
  };

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #drawer = inject(MatDrawer);
  #store = inject(Store);

  get satelliteYears(): string[] {
    return ['', ...satelliteYears.slice().reverse()];
  }

  cancel(): void {
    this.#drawer.close();
  }

  ngOnInit(): void {
    this.#handleSetup$();
  }

  save(record: Partial<ViewStateModel>): void {
    this.#store.dispatch(new SetParcelCoding(record.parcelCoding));
    if (record.satelliteYear !== null)
      this.#store.dispatch([
        new SetSatelliteYear(record.satelliteYear),
        new SetSideBySideView(true)
      ]);
    else this.#store.dispatch(new SetSideBySideView(true));
    this.#drawer.close();
  }

  #handleSetup$(): void {
    this.view$.pipe(takeUntil(this.#destroy$)).subscribe((view) => {
      this.record = copy(view);
      this.#cdf.markForCheck();
    });
  }
}
