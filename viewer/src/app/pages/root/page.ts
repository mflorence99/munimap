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

import { filter } from 'rxjs/operators';
import { satelliteYears } from '@lib/ol/ol-source-satellite';
import { takeUntil } from 'rxjs/operators';

import urlParse from 'url-parse';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-root',
  styleUrls: ['./page.scss'],
  templateUrl: './page.html'
})
export class RootPage implements OnInit {
  #url: any;

  @Select(ViewState.gps) gps$: Observable<boolean>;

  hasLeftSidebar: boolean;
  hasRightSidebar: boolean;

  @Select(MapState) map$: Observable<Map>;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  @Select(ViewState.satelliteYear) satelliteYear$: Observable<string>;

  get satelliteYears(): string[] {
    return ['', ...satelliteYears.slice().reverse()];
  }

  title: string;

  @Select(AnonState.user) user$: Observable<User>;

  constructor(
    private destroy$: DestroyService,
    private dialog: MatDialog,
    private location: Location,
    private router: Router,
    private store: Store,
    private titleService: Title,
    _version: VersionService /* 👈 just to get it loaded */
  ) {
    this.#url = urlParse(this.location.path(), true);
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
}
