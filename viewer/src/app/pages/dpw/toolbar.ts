import { DPWPage } from './page';
import { RootPage } from '../root/page';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Landmark } from '@lib/common';
import { LandmarksState } from '@lib/state/landmarks';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';

import { inject } from '@angular/core';
import { map } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dpw-toolbar',
  template: `
    <mat-button-toggle [checked]="true">
      <fa-icon [icon]="['fad', 'road']" size="lg"></fa-icon>
      &nbsp;
      <select (change)="onFilterStreet($any($event.target).value)">
        <option value="" class="location">All Streets</option>
        @for (location of locations$ | async; track location) {
          <option class="location">
            {{ location }}
          </option>
        }
      </select>
    </mat-button-toggle>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .location {
        background-color: var(--mat-gray-800);
        color: var(--text-color);
        margin: 4px;
      }
    `
  ]
})
export class DPWToolbarComponent {
  @Select(LandmarksState) landmarks$: Observable<Landmark[]>;

  locations$: Observable<string[]>;

  #root = inject(RootPage);

  constructor() {
    this.locations$ = this.landmarks$.pipe(
      map((landmarks) =>
        landmarks.map(
          (landmark): string => landmark.properties.metadata.location
        )
      ),
      map((locations) => locations.sort()),
      map((locations) => [...new Set(locations)])
    );
  }

  onFilterStreet(street: string): void {
    (this.#root.routedPageComponent as DPWPage).filterFn$.next(
      (landmark: Landmark): boolean =>
        !street || landmark.properties.metadata?.location === street
    );
  }
}
