import { Actions } from '@ngxs/store';
import { AuthState } from '@lib/state/auth';
import { CanDo } from '@lib/state/parcels';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { Event } from '@angular/router';
import { NavigationCancel } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { NavigationError } from '@angular/router';
import { NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Profile } from '@lib/state/auth';
import { Redo } from '@lib/state/parcels';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Undo } from '@lib/state/parcels';
import { User } from '@lib/state/auth';
import { VersionService } from '@lib/services/version';
import { ViewChild } from '@angular/core';

import { moveFromLeftFade } from 'ngx-router-animations';
import { ofActionSuccessful } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';
import { transition } from '@angular/animations';
import { trigger } from '@angular/animations';
import { useAnimation } from '@angular/animations';

@Component({
  animations: [
    trigger('moveFromLeftFade', [
      transition('* => *', useAnimation(moveFromLeftFade))
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-root',
  styleUrls: ['./page.scss'],
  templateUrl: './page.html'
})
export class RootPage implements OnInit {
  canRedo = false;
  canUndo = false;

  loading = false;

  @ViewChild(RouterOutlet) outlet;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  title: string;

  @Select(AuthState.user) user$: Observable<User>;

  constructor(
    private actions$: Actions,
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private router: Router,
    private store: Store,
    _version: VersionService /* 👈 just to get it loaded */
  ) {}

  #handleActions$(): void {
    this.actions$
      .pipe(takeUntil(this.destroy$), ofActionSuccessful(CanDo))
      .subscribe((action: CanDo) => {
        this.canRedo = action.canRedo;
        this.canUndo = action.canUndo;
        this.cdf.markForCheck();
      });
  }

  #handleRouterEvents$(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = (): boolean => false;
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: Event) => {
        switch (true) {
          case event instanceof NavigationStart: {
            this.loading = true;
            break;
          }
          case event instanceof NavigationEnd:
          case event instanceof NavigationCancel:
          case event instanceof NavigationError: {
            // 👇 see https://stackoverflow.com/questions/59552387/how-to-reload-a-page-in-angular-8-the-proper-way
            this.router.navigated = false;
            this.loading = false;
            break;
          }
          default: {
            break;
          }
        }
      });
  }

  getState(): any {
    return this.outlet?.activatedRouteData?.state;
  }

  ngOnInit(): void {
    this.#handleActions$();
    this.#handleRouterEvents$();
  }

  redo(): void {
    this.store.dispatch(new Redo());
  }

  setTitle(title: string): void {
    this.title = title;
  }

  undo(): void {
    this.store.dispatch(new Undo());
  }
}
