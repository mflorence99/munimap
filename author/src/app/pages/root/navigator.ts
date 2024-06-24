import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { CollectionReference } from '@angular/fire/firestore';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { Firestore } from '@angular/fire/firestore';
import { Map } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Profile } from '@lib/state/auth';
import { Store } from '@ngxs/store';
import { VersionService } from '@lib/services/version';

import { collection } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { limit } from '@angular/fire/firestore';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { orderBy } from '@angular/fire/firestore';
import { query } from '@angular/fire/firestore';
import { takeUntil } from 'rxjs/operators';
import { theState } from '@lib/common';
import { where } from '@angular/fire/firestore';
import { workgroup } from '@lib/state/auth';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-navigator',

  template: `
    <nav class="form navigator">
      <ul>
        <li (click)="close()" routerLink="/create" class="item">
          <fa-icon
            [class.selected]="title()?.startsWith(state)"
            [icon]="['fad', 'layer-plus']"
            class="icon"
            size="3x"></fa-icon>
          <div class="title()">Create a new map</div>
          <div class="subtitle">Choose the county and town.</div>
        </li>

        <hr />

        <li class="item">
          <div></div>
          <div class="title()">RECENTLY USED MAPS</div>
        </li>

        @for (map of topMaps$ | async; track map.id) {
          <li
            (click)="close()"
            class="item"
            routerLink="/{{ map.type }}/{{ map.id }}">
            <fa-icon
              [class.selected]="title() === map.name"
              [icon]="['fad', 'layer-group']"
              class="icon"
              size="3x"></fa-icon>

            <div class="title()">{{ map.name }}</div>
            <div class="subtitle">{{ map.owner }}</div>
          </li>
        }

        <hr />

        <li (click)="close()" class="item" routerLink="/list">
          <fa-icon
            [class.selected]="title() === 'All Maps'"
            [icon]="['fad', 'list']"
            class="icon"
            size="2x"></fa-icon>
          <div class="title()">All Maps</div>
          <div class="subtitle">Sortable and selectable list of all maps.</div>
        </li>

        <hr />

        <li (click)="reset()" class="item">
          <fa-icon
            [icon]="['fad', 'sync']"
            class="icon selected"
            size="2x"></fa-icon>
          <div class="title()">Reload MuniMap</div>
          <div class="subtitle">App will be updated to the latest version.</div>
        </li>
      </ul>
    </nav>
  `,
  styles: [
    `
      .navigator {
        .item {
          align-items: center;
          cursor: pointer;
          display: grid;
          grid-column-gap: 1rem;
          grid-template-areas: 'icon title' 'icon subtitle';
          grid-template-columns: 3.5rem 1fr;
          padding: 0.5rem 0;

          .icon {
            --fa-primary-color: var(--text-color);
            --fa-secondary-color: var(--text-color);

            grid-area: icon;
            justify-self: center;

            &.selected {
              --fa-primary-color: var(--text-color);
              --fa-secondary-color: var(--accent-color);
            }
          }

          .title {
            align-self: end;
            font-size: larger;
            font-weight: bold;
            grid-area: title;
          }

          .subtitle {
            align-self: start;
            font-size: smaller;
            grid-area: subtitle;
          }
        }
      }
    `
  ]
})
export class NavigatorComponent implements OnInit {
  profile$: Observable<Profile>;

  maxMapCount = input(5);
  state = theState;
  title = input<string>();
  topMaps$: Observable<Map[]>;

  #destroy$ = inject(DestroyService);
  #drawer = inject(MatDrawer);
  #firestore = inject(Firestore);
  #store = inject(Store);
  #version = inject(VersionService);

  constructor() {
    this.profile$ = this.#store.select(AuthState.profile);
  }

  close(): void {
    this.#drawer.close();
  }

  ngOnInit(): void {
    this.topMaps$ = this.#handleTopMaps$();
  }

  reset(): void {
    this.#version.hardReset();
  }

  #handleTopMaps$(): Observable<Map[]> {
    return this.profile$.pipe(
      takeUntil(this.#destroy$),
      mergeMap((profile) => {
        if (!profile?.email) return of([]);
        else {
          // 👇 show the N most recently-used maps
          console.log(
            `%cFirestore query: maps where owner in ${JSON.stringify(
              workgroup(profile)
            )} orderBy timestamp desc`,
            'color: goldenrod'
          );
          return collectionData<Map>(
            query(
              collection(this.#firestore, 'maps') as CollectionReference<Map>,
              where('owner', 'in', workgroup(profile)),
              orderBy('timestamp', 'desc'),
              limit(this.maxMapCount())
            )
          );
        }
      })
    );
  }
}
