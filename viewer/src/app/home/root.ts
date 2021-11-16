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
  @Select(AnonState.user) user$: Observable<User>;

  constructor(private destroy$: DestroyService, private store: Store) {}

  #handleMap$(): void {
    this.map$.pipe(takeUntil(this.destroy$)).subscribe((map) => {
      // 🔥 what if no map?
      if (map) this.store.dispatch(new LoadProfile(map.owner));
    });
  }

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
  }
}
