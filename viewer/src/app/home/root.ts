import { AnonState } from '@lib/state/anon';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { LoadMap } from '@lib/state/map';
import { LoadProfile } from '@lib/state/anon';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { User } from '@lib/state/auth';

import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-root',
  styleUrls: ['./root.scss'],
  templateUrl: './root.html'
})
export class RootPage implements OnInit {
  @Select(MapState) map$: Observable<Map>;

  title: string;

  @Select(AnonState.user) user$: Observable<User>;

  constructor(
    private destroy$: DestroyService,
    private router: Router,
    private store: Store
  ) {}

  // 👉 when we've loaded the map, we can load the profile of the
  //    map's owner, which will give us their workgroup
  #handleMap$(): void {
    this.map$.pipe(takeUntil(this.destroy$)).subscribe((map) => {
      // 🔥 what if no map?
      if (map) {
        this.title = map.name;
        this.store.dispatch(new LoadProfile(map.owner));
      }
    });
  }

  // 👉 when we've authenticated anonymously, we can load the map
  #handleUser$(): void {
    this.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      // 🔥 what map to load?
      //    what default to use?
      if (user) this.store.dispatch(new LoadMap('washington', null));
    });
  }

  ngOnInit(): void {
    this.#handleMap$();
    this.#handleUser$();
    // 👉 it doesn't matter when we naviate, because guards prevent
    //    the page from loading until everything is set
    this.router.navigate(['/town-map']);
  }
}
