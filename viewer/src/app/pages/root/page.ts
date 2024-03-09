import { AnonState } from '@lib/state/anon';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { LoadMap } from '@lib/state/map';
import { LoadProfile } from '@lib/state/anon';
import { Location } from '@angular/common';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@lib/components/message-dialog';
import { MessageDialogData } from '@lib/components/message-dialog';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { SetGPS } from '@lib/state/view';
import { SetSatelliteView } from '@lib/state/view';
import { SetSatelliteYear } from '@lib/state/view';
import { Store } from '@ngxs/store';
import { Title } from '@angular/platform-browser';
import { User } from '@lib/state/auth';
import { VersionService } from '@lib/services/version';
import { ViewState } from '@lib/state/view';
import { ViewStateModel } from '@lib/state/view';

import { combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { satelliteYears } from '@lib/ol/ol-source-satellite';
import { takeUntil } from 'rxjs/operators';

import urlParse from 'url-parse';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-root',
  template: `
    <main class="page">
      <mat-toolbar class="toolbar">
        @if (hasLeftSidebar) {
          <button (click)="leftSidebar.toggle()" mat-icon-button>
            <fa-icon [icon]="['fas', 'bars']" size="2x"></fa-icon>
          </button>
        }

        <h1 class="title">
          @if (title) {
            {{ title }}
          }
        </h1>

        <div class="filler"></div>

        <mat-button-toggle
          #satelliteViewToggle
          (change)="onSatelliteViewToggle(satelliteViewToggle.checked)"
          [checked]="satelliteView$ | async">
          <fa-icon [icon]="['fad', 'globe-americas']" size="lg"></fa-icon>
          @if (canPickSatelliteYear()) {
            &nbsp;
            <select
              (change)="onSatelliteYear($any($event.target).value)"
              (click)="eatMe($event)"
              [disabled]="!(satelliteView$ | async)">
              @for (year of satelliteYears; track year) {
                <option
                  [attr.selected]="
                    year === (satelliteYear$ | async) ? 'true' : null
                  "
                  [value]="year"
                  class="year">
                  {{ year || 'Latest' }}
                </option>
              }
            </select>
          }
        </mat-button-toggle>

        <mat-button-toggle
          #gpsToggle
          (change)="onGPSToggle(gpsToggle.checked)"
          [checked]="gps$ | async">
          <fa-icon [icon]="['fad', 'map-marker-alt']" size="lg"></fa-icon>
        </mat-button-toggle>

        @if (hasRightSidebar) {
          <mat-button-toggle
            (change)="rightSidebar.toggle()"
            [checked]="rightSidebar.opened">
            <fa-icon [icon]="['fad', 'palette']" size="lg"></fa-icon>
          </mat-button-toggle>
        }
        @if (!hasLeftSidebar) {
          <button (click)="reset()" mat-icon-button>
            <fa-icon [icon]="['fas', 'sync']" size="2x"></fa-icon>
          </button>
        }
      </mat-toolbar>

      <mat-drawer-container class="container">
        <mat-drawer #leftSidebar class="sidebar" mode="over" position="start">
          <router-outlet name="leftSidebar"></router-outlet>
        </mat-drawer>

        <mat-drawer #rightSidebar class="sidebar" mode="over" position="end">
          <router-outlet name="rightSidebar"></router-outlet>
        </mat-drawer>

        <mat-drawer-content class="content">
          <router-outlet></router-outlet>
        </mat-drawer-content>
      </mat-drawer-container>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      .container {
        height: calc(100% - (var(--map-cy-toolbar) * 1px));
        position: absolute;
        top: calc(var(--map-cy-toolbar) * 1px);
        width: 100%;
      }

      .content {
        height: 100%;
        overflow: hidden;
        position: absolute;
        width: 100%;
      }

      .filler {
        flex-grow: 1;
      }

      .page {
        height: 100%;
        overflow: hidden;
        position: absolute;
        width: 100%;
      }

      .sidebar {
        height: 100%;
      }

      .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .toolbar {
        display: flex;
        gap: 0.5rem;
        height: calc(var(--map-cy-toolbar) * 1px);
        padding: 0 0.5rem !important;
        position: absolute;
        width: 100%;
      }

      .year {
        background-color: var(--mat-gray-800);
        color: var(--text-color);
      }
    `
  ]
})
export class RootPage implements OnInit {
  @Select(ViewState.gps) gps$: Observable<boolean>;

  @Select(MapState) map$: Observable<Map>;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  @Select(ViewState.satelliteYear) satelliteYear$: Observable<string>;

  @Select(AnonState.user) user$: Observable<User>;

  @Select(ViewState) view$: Observable<ViewStateModel>;

  hasLeftSidebar: boolean;
  hasRightSidebar: boolean;

  title: string;

  zoom$: Observable<number>;

  #url: any;

  constructor(
    private destroy$: DestroyService,
    private dialog: MatDialog,
    private location: Location,
    private router: Router,
    private store: Store,
    private titleService: Title,
    private version: VersionService
  ) {
    this.zoom$ = combineLatest([this.map$, this.view$]).pipe(
      // 🔥 sometimes triggered by ???
      map(([map, view]) => view.viewByPath[map.path]?.zoom ?? 15)
    );
    this.#url = urlParse(this.location.path(), true);
  }

  get satelliteYears(): string[] {
    return ['', ...satelliteYears.slice().reverse()];
  }

  canPickSatelliteYear(): boolean {
    return window.innerWidth >= 480;
  }

  eatMe(event: Event): void {
    event.stopPropagation();
  }

  ngOnInit(): void {
    this.#handleMap$();
    this.#handleUser$();
  }

  onGPSToggle(state: boolean): void {
    this.store.dispatch(new SetGPS(state));
  }

  onSatelliteViewToggle(state: boolean): void {
    this.store.dispatch(new SetSatelliteView(state));
  }

  onSatelliteYear(year: string): void {
    this.store.dispatch(new SetSatelliteYear(year));
  }

  reset(): void {
    this.version.hardReset();
  }

  // 👉 when we've loaded the map, we can load the profile of the
  //    map's owner, which will give us their workgroup
  #handleMap$(): void {
    this.map$
      .pipe(
        takeUntil(this.destroy$),
        filter((map) => !!map)
      )
      .subscribe((map) => {
        // 👉 if the LoadMap fails, the default will be set
        if (map.isDflt) {
          const data: MessageDialogData = {
            message: 'The requested app is no longer available'
          };
          this.dialog.open(MessageDialogComponent, { data });
        } else {
          this.title = map.name;
          this.titleService.setTitle(map.name);
          this.store.dispatch(new LoadProfile(map.owner));
          // 👉 we don't have to wait until the profile is loaded,
          //    because guards prevent
          //    the page from loading until everything is set
          this.router.navigateByUrl(this.#makeURL(map), {
            skipLocationChange: true
          });
        }
      });
  }

  // 👉 when we've authenticated anonymously, we can load the map
  //    we get the map ID from the domain (used live)
  //    or from ...?id= (used in testing)
  #handleUser$(): void {
    this.user$
      .pipe(
        takeUntil(this.destroy$),
        // 🐛 Firebase Missing or insufficient permissions.
        filter((user) => !!user)
      )
      .subscribe(() => {
        let fromDomain;
        const fromParams = this.#url.query.id;
        const parts = this.#url.hostname.split('.');
        if (parts.length === 3) fromDomain = parts[0];
        // 👇 take the map ID from the params first, so that we can
        //    override it with the domain if necessary
        this.store.dispatch(new LoadMap(fromParams ?? fromDomain, null));
      });
  }

  // 🔥 obviously kind of generalized but heavily-dependent
  //    on route structure

  #makeURL(map: Map): string {
    const parts = [`/${map.type}`];
    const inner = [];
    // 👉 is there a left sidebar?
    let route = this.router.config[0].children.find(
      (route) =>
        route.path.startsWith(`${map.type}-`) && route.outlet === 'leftSidebar'
    );
    if (route) {
      inner.push(`leftSidebar:${route.path}`);
      this.hasLeftSidebar = true;
    }
    // 👉 is there a right sidebar?
    route = this.router.config[0].children.find(
      (route) =>
        route.path.startsWith(`${map.type}-`) && route.outlet === 'rightSidebar'
    );
    if (route) {
      inner.push(`rightSidebar:${route.path}`);
      this.hasRightSidebar = true;
    }
    // 👉 maybe no sidebars at all?
    if (inner.length > 0) parts.push(`(${inner.join('//')})`);
    parts.push(`?id=${map.id}`);
    return parts.join('');
  }
}
