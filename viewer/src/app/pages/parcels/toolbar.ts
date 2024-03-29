import { RootPage } from '../root/page';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { SetSatelliteView } from '@lib/state/view';
import { Store } from '@ngxs/store';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-toolbar',
  template: `
    <app-sink #sink [satelliteView]="root.satelliteView$ | async" />

    <button
      mat-icon-button
      (click)="onSatelliteViewToggle(!sink.satelliteView)"
      [ngClass]="{ 'mat-icon-button-checked': sink.satelliteView }">
      <fa-icon [icon]="['fad', 'globe-americas']" size="lg"></fa-icon>
    </button>
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

  onSatelliteViewToggle(state: boolean): void {
    this.#store.dispatch(new SetSatelliteView(state));
  }
}
