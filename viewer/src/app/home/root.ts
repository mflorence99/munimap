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
import { Store } from '@ngxs/store';
import { Title } from '@angular/platform-browser';
import { User } from '@lib/state/auth';
import { ViewState } from '@lib/state/view';

import { filter } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';

import urlParse from 'url-parse';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-root',
  styleUrls: ['./root.scss'],
  templateUrl: './root.html'
})
export class RootPage implements OnInit {
  #url: any;

  @Select(ViewState.gps) gps$: Observable<boolean>;

  @Select(MapState) map$: Observable<Map>;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  title: string;

  @Select(AnonState.user) user$: Observable<User>;

  constructor(
    private destroy$: DestroyService,
    private dialog: MatDialog,
    private location: Location,
    private router: Router,
    private store: Store,
    private titleService: Title
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
          this.router.navigate(['/town-map'], { queryParams: { id: map.id } });
        }
      });
  }

  // 👉 when we've authenticated anonymously, we can load the map
  //    we get the map ID from the domain (preferred, used live)
  //    or from ...?id= (used in testing)
  #handleUser$(): void {
    this.user$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      let id;
      const parts = this.#url.hostname.split('.');
      if (parts.length === 3) id = parts[0];
      else id = this.#url.query.id;
      this.store.dispatch(new LoadMap(id, null));
    });
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
}
