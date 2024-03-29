import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { ParcelCoding } from '@lib/state/view';
import { Select } from '@ngxs/store';
import { SetParcelCoding } from '@lib/state/view';
import { Store } from '@ngxs/store';
import { ViewState } from '@lib/state/view';
import { ViewStateModel } from '@lib/state/view';

import { inject } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-setup',
  template: `
    <header class="header">
      <figure class="icon palette">
        <fa-icon [icon]="['fad', 'palette']" size="2x"></fa-icon>
      </figure>

      <p class="title">Color code parcels</p>
      <p class="subtitle">Parcel color-coding strategy</p>
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
        class="strategies"
        name="strategy"
        required>
        <mat-radio-button value="usage">By land use</mat-radio-button>
        <mat-radio-button value="ownership">
          By ownership
          <sup>[1]</sup>
        </mat-radio-button>
        <mat-radio-button value="conformity">
          By conformity
          <sup>[1]</sup>
        </mat-radio-button>
      </mat-radio-group>

      <p class="instructions">
        <sup>[1]</sup>
        These color-codings are experimental. Contact
        <a href="mailto:munimap.helpdesk@gmail.com" target="_blank">
          munimap.helpdesk&#64;gmail.com
        </a>
        with questions or suggestions.
      </p>
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
  styles: [
    `
      /* 👇 attempt to draw real palette from duotone icon */
      .palette {
        --fa-primary-color: var(--mat-yellow-300);
        --fa-secondary-color: var(--mat-brown-500);
      }

      .strategies {
        display: grid;
        grid-template-rows: 1fr;
      }
    `
  ]
})
export class ParcelsSetupComponent implements OnInit {
  @Select(ViewState.parcelCoding) parcelCoding$: Observable<ParcelCoding>;

  record: Partial<ViewStateModel> = {
    parcelCoding: 'usage'
  };

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #drawer = inject(MatDrawer);
  #store = inject(Store);

  cancel(): void {
    this.#drawer.close();
  }

  ngOnInit(): void {
    this.#handleSetup$();
  }

  save(record: Partial<ViewStateModel>): void {
    this.#store.dispatch(new SetParcelCoding(record.parcelCoding));
    this.#drawer.close();
  }

  #handleSetup$(): void {
    this.parcelCoding$
      .pipe(takeUntil(this.#destroy$))
      .subscribe((parcelCoding) => {
        this.record = { parcelCoding };
        this.#cdf.markForCheck();
      });
  }
}
