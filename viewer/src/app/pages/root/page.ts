import { Location } from "@angular/common";
import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { MessageDialogComponent } from "@lib/components/message-dialog";
import { MessageDialogData } from "@lib/components/message-dialog";
import { DestroyService } from "@lib/services/destroy";
import { VersionService } from "@lib/services/version";
import { AnonActions } from "@lib/state/anon";
import { AnonState } from "@lib/state/anon";
import { User } from "@lib/state/auth";
import { Map } from "@lib/state/map";
import { MapActions } from "@lib/state/map";
import { MapState } from "@lib/state/map";
import { ParcelCoding } from "@lib/state/view";
import { ViewActions } from "@lib/state/view";
import { ViewState } from "@lib/state/view";
import { ViewStateModel } from "@lib/state/view";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";

import { inject } from "@angular/core";
import { combineLatest } from "rxjs";
import { filter } from "rxjs/operators";
import { map } from "rxjs/operators";
import { takeUntil } from "rxjs/operators";

import urlParse from "url-parse";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: "app-root",
  template: `

    @let sink = {
      gps: gps$ | async
    };

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

        <router-outlet name="toolbar"></router-outlet>

        <button
          mat-icon-button
          (click)="onGPSToggle(!sink.gps)"
          [ngClass]="{ 'mat-icon-button-checked': sink.gps }">
          <fa-icon [icon]="['fad', 'map-marker-alt']" size="lg"></fa-icon>
        </button>

        @if (hasRightSidebar) {
          <button (click)="rightSidebar.toggle()" mat-icon-button>
            <fa-icon [icon]="['fas', 'cog']" size="lg"></fa-icon>
          </button>
        }

        <button (click)="reset()" mat-icon-button>
          <fa-icon [icon]="['fas', 'sync']" size="lg"></fa-icon>
        </button>
      </mat-toolbar>

      <mat-drawer-container class="container">
        <mat-drawer #leftSidebar class="sidebar" mode="over" position="start">
          <router-outlet name="leftSidebar"></router-outlet>
        </mat-drawer>

        <mat-drawer #rightSidebar class="sidebar" mode="over" position="end">
          <router-outlet name="rightSidebar"></router-outlet>
        </mat-drawer>

        <mat-drawer-content class="content">
          <router-outlet (activate)="onActivateRoute($event)"></router-outlet>
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
        height: calc(var(--map-cy-toolbar) * 1px);
        padding: 0 0.5rem !important;
        position: absolute;
        width: 100%;
      }
    `
  ]
})
export class RootPage implements OnInit {
  gps$: Observable<boolean>;
  hasLeftSidebar: boolean;
  hasRightSidebar: boolean;
  hasToolbar: boolean;
  historicalMapLeft$: Observable<string>;
  historicalMapRight$: Observable<string>;
  mapState$: Observable<Map>;
  parcelCoding$: Observable<ParcelCoding>;
  routedPageComponent: any;
  satelliteView$: Observable<boolean>;
  satelliteYear$: Observable<string>;
  sideBySideView$: Observable<boolean>;
  streetFilter$: Observable<string>;
  title: string;
  user$: Observable<User>;
  view$: Observable<ViewStateModel>;
  zoom$: Observable<number>;

  #destroy$ = inject(DestroyService);
  #dialog = inject(MatDialog);
  #location = inject(Location);
  #router = inject(Router);
  #store = inject(Store);
  #title = inject(Title);
  #url = urlParse(this.#location.path(), true);
  #version = inject(VersionService);

  constructor() {
    this.gps$ = this.#store.select(ViewState.gps);
    this.historicalMapLeft$ = this.#store.select(ViewState.historicalMapLeft);
    this.historicalMapRight$ = this.#store.select(ViewState.historicalMapRight);
    this.mapState$ = this.#store.select(MapState.map);
    this.parcelCoding$ = this.#store.select(ViewState.parcelCoding);
    this.satelliteView$ = this.#store.select(ViewState.satelliteView);
    this.satelliteYear$ = this.#store.select(ViewState.satelliteYear);
    this.sideBySideView$ = this.#store.select(ViewState.sideBySideView);
    this.streetFilter$ = this.#store.select(ViewState.streetFilter);
    this.user$ = this.#store.select(AnonState.user);
    this.view$ = this.#store.select(ViewState.view);
    this.zoom$ = combineLatest([this.mapState$, this.view$]).pipe(
      // 🔥 sometimes triggered by ???
      map(([mapState, view]) => view.viewByPath[mapState.path]?.zoom ?? 15)
    );
  }

  ngOnInit(): void {
    this.#handleMap$();
    this.#handleUser$();
  }

  onActivateRoute(cRef): void {
    this.routedPageComponent = cRef;
  }

  onGPSToggle(state: boolean): void {
    this.#store.dispatch(new ViewActions.SetGPS(state));
  }

  reset(): void {
    this.#version.hardReset();
  }

  // 👉 when we've loaded the map, we can load the profile of the
  //    map's owner, which will give us their workgroup
  #handleMap$(): void {
    this.mapState$
      .pipe(
        takeUntil(this.#destroy$),
        filter((mapState) => !!mapState)
      )
      .subscribe((mapState) => {
        // 👉 if the LoadMap fails, the default will be set
        if (mapState.isDflt) {
          const data: MessageDialogData = {
            message: "The requested app is no longer available"
          };
          this.#dialog.open(MessageDialogComponent, { data });
        } else {
          this.title = mapState.name;
          this.#title.setTitle(mapState.name);
          this.#store.dispatch(new AnonActions.LoadProfile(mapState.owner));
          // 👉 we don't have to wait until the profile is loaded,
          //    because guards prevent
          //    the page from loading until everything is set
          this.#router.navigateByUrl(this.#makeURL(mapState), {
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
        takeUntil(this.#destroy$),
        // 🐛 Firebase Missing or insufficient permissions.
        filter((user) => !!user)
      )
      .subscribe(() => {
        let fromDomain;
        const fromParams = this.#url.query.id;
        const parts = this.#url.hostname.split(".");
        if (parts.length === 3) fromDomain = parts[0];
        // 👇 take the map ID from the params first, so that we can
        //    override it with the domain if necessary
        this.#store.dispatch(
          new MapActions.LoadMap(fromParams ?? fromDomain, null)
        );
      });
  }

  // 🔥 obviously kind of generalized but heavily-dependent
  //    on route structure

  #makeURL(map: Map): string {
    const parts = [`/${map.type}`];
    const inner = [];
    // 👉 what data associated with this route?
    let route = this.#router.config[0].children.find(
      (route) => route.path === `${map.type}`
    );
    // 👉 is there a left sidebar?
    route = this.#router.config[0].children.find(
      (route) =>
        route.path.startsWith(`${map.type}-`) && route.outlet === "leftSidebar"
    );
    if (route) {
      inner.push(`leftSidebar:${route.path}`);
      this.hasLeftSidebar = true;
    }
    // 👉 is there a right sidebar?
    route = this.#router.config[0].children.find(
      (route) =>
        route.path.startsWith(`${map.type}-`) && route.outlet === "rightSidebar"
    );
    if (route) {
      inner.push(`rightSidebar:${route.path}`);
      this.hasRightSidebar = true;
    }
    // 👉 is there a toolbar?
    route = this.#router.config[0].children.find(
      (route) =>
        route.path.startsWith(`${map.type}-`) && route.outlet === "toolbar"
    );
    if (route) {
      inner.push(`toolbar:${route.path}`);
      this.hasToolbar = true;
    }
    // 👉 maybe no sidebars at all?
    if (inner.length > 0) parts.push(`(${inner.join("//")})`);
    parts.push(`?id=${map.id}`);
    return parts.join("");
  }
}
