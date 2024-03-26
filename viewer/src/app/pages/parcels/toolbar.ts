import { RootPage } from '../root/page';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { SetSatelliteView } from '@lib/state/view';
import { SetSatelliteYear } from '@lib/state/view';
import { Store } from '@ngxs/store';

import { inject } from '@angular/core';
import { satelliteYears } from '@lib/ol/ol-source-satellite';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-toolbar',
  template: `
    <app-sink
      #sink
      [satelliteView]="root.satelliteView$ | async"
      [satelliteYear]="root.satelliteYear$ | async" />

    <mat-button-toggle
      #satelliteViewToggle
      (change)="onSatelliteViewToggle(satelliteViewToggle.checked)"
      [checked]="sink.satelliteView">
      <fa-icon [icon]="['fad', 'globe-americas']" size="lg"></fa-icon>
      @if (canPickSatelliteYear()) {
        &nbsp;
        <select
          (change)="onSatelliteYear($any($event.target).value)"
          (click)="eatMe($event)"
          [disabled]="!sink.satelliteView">
          @for (year of satelliteYears; track year) {
            <option
              [attr.selected]="year === sink.satelliteYear ? 'true' : null"
              [value]="year"
              class="year">
              {{ year || 'Latest' }}
            </option>
          }
        </select>
      }
    </mat-button-toggle>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .year {
        background-color: var(--mat-gray-800);
        color: var(--text-color);
      }
    `
  ]
})
export class ParcelsToolbarComponent {
  root = inject(RootPage);

  #store = inject(Store);

  get satelliteYears(): string[] {
    return ['', ...satelliteYears.slice().reverse()];
  }

  canPickSatelliteYear(): boolean {
    return window.innerWidth >= 480;
  }

  eatMe(event: Event): void {
    event.stopPropagation();
  }

  onSatelliteViewToggle(state: boolean): void {
    this.#store.dispatch(new SetSatelliteView(state));
  }

  onSatelliteYear(year: string): void {
    this.#store.dispatch(new SetSatelliteYear(year));
  }
}
