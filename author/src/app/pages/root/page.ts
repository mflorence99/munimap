import { Actions } from '@ngxs/store';
import { AuthState } from '@lib/state/auth';
import { CanDo } from '@lib/state/undo';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { ClearStacks } from '@lib/state/undo';
import { Component } from '@angular/core';
import { CreateMapError } from '@lib/state/map';
import { DestroyService } from '@lib/services/destroy';
import { Event } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@lib/components/message-dialog';
import { MessageDialogData } from '@lib/components/message-dialog';
import { NavigationCancel } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { NavigationError } from '@angular/router';
import { NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Profile } from '@lib/state/auth';
import { Redo } from '@lib/state/undo';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Select } from '@ngxs/store';
import { SetSatelliteView } from '@lib/state/view';
import { Store } from '@ngxs/store';
import { Undo } from '@lib/state/undo';
import { UpdateMapError } from '@lib/state/map';
import { User } from '@lib/state/auth';
import { VersionService } from '@lib/services/version';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';
import { Working } from '@lib/state/working';

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
  @ViewChild(RouterOutlet) outlet;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  @Select(AuthState.user) user$: Observable<User>;

  canRedo = false;
  canUndo = false;

  loading = false;

  title: string;

  working = 0;

  constructor(
    private actions$: Actions,
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private dialog: MatDialog,
    private router: Router,
    private store: Store,
    _version: VersionService /* 👈 just to get it loaded */
  ) {}

  getState(): any {
    return this.outlet?.activatedRouteData?.state;
  }

  ngOnInit(): void {
    this.#handleMapErrorActions$();
    this.#handleRouterEvents$();
    this.#handleUndoActions$();
    this.#handleWorkingActions$();
  }

  onSatelliteViewToggle(state: boolean): void {
    this.store.dispatch(new SetSatelliteView(state));
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

  #handleMapErrorActions$(): void {
    this.actions$
      .pipe(
        ofActionSuccessful(CreateMapError, UpdateMapError),
        takeUntil(this.destroy$)
      )
      .subscribe((action: CreateMapError | UpdateMapError) => {
        const data: MessageDialogData = {
          message: action.error
        };
        this.dialog.open(MessageDialogComponent, { data });
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
            // 👉 clear the "undo" stacks on a page transition
            this.store.dispatch(new ClearStacks());
            break;
          }
          default: {
            break;
          }
        }
      });
  }

  #handleUndoActions$(): void {
    this.actions$
      .pipe(takeUntil(this.destroy$), ofActionSuccessful(CanDo))
      .subscribe((action: CanDo) => {
        this.canRedo = action.canRedo;
        this.canUndo = action.canUndo;
        this.cdf.markForCheck();
      });
  }

  #handleWorkingActions$(): void {
    this.actions$
      .pipe(takeUntil(this.destroy$), ofActionSuccessful(Working))
      .subscribe((action: Working) => {
        this.working = Math.max(0, this.working + action.increment);
        console.log({ working: this.working });
        this.cdf.markForCheck();
      });
  }
}
