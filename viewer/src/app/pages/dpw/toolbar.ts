import { RootPage } from '../root/page';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Landmark } from '@lib/common';
import { LandmarksState } from '@lib/state/landmarks';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { SetStreetFilter } from '@lib/state/view';
import { Store } from '@ngxs/store';

import { inject } from '@angular/core';
import { map } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dpw-toolbar',
  template: `
    @if (canPickStreetFilter()) {
      <app-sink #sink [streetFilter]="root.streetFilter$ | async" />

      <mat-button-toggle [checked]="true">
        <fa-icon [icon]="['fad', 'road']" size="lg"></fa-icon>
        &nbsp;
        <select
          (change)="onFilterStreet($any($event.target).value)"
          (click)="eatMe($event)">
          <option
            [attr.selected]="'' === sink.streetFilter ? 'true' : null"
            value=""
            class="location">
            All Streets
          </option>
          @for (street of streets$ | async; track street) {
            <option
              [attr.selected]="street === sink.streetFilter ? 'true' : null"
              [value]="street"
              class="street">
              {{ street }}
            </option>
          }
        </select>
      </mat-button-toggle>
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .street {
        background-color: var(--mat-gray-800);
        color: var(--text-color);
      }
    `
  ]
})
export class DPWToolbarComponent {
  @Select(LandmarksState) landmarks$: Observable<Landmark[]>;

  root = inject(RootPage);
  streets$: Observable<string[]>;

  #store = inject(Store);

  constructor() {
    this.streets$ = this.landmarks$.pipe(
      map((landmarks) =>
        landmarks.map(
          (landmark): string => landmark.properties.metadata.location
        )
      ),
      map((streets) => streets.sort()),
      map((streets) => [...new Set(streets)])
    );
  }

  canPickStreetFilter(): boolean {
    return window.innerWidth >= 480;
  }

  eatMe(event: Event): void {
    event.stopPropagation();
  }

  onFilterStreet(street: string): void {
    this.#store.dispatch(new SetStreetFilter(street));
  }
}
