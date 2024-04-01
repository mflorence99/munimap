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
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
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
import { Store } from '@ngxs/store';
import { Undo } from '@lib/state/undo';
import { UpdateMapError } from '@lib/state/map';
import { User } from '@lib/state/auth';
import { VersionService } from '@lib/services/version';
import { ViewState } from '@lib/state/view';
import { Working } from '@lib/state/working';

import { inject } from '@angular/core';
import { moveFromLeftFade } from 'ngx-router-animations';
import { ofActionSuccessful } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';
import { transition } from '@angular/animations';
import { trigger } from '@angular/animations';
import { useAnimation } from '@angular/animations';
import { viewChild } from '@angular/core';

@Component({
  animations: [
    trigger('moveFromLeftFade', [
      transition('* => *', useAnimation(moveFromLeftFade))
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-root',
  template: `
    <app-sink #sink [profile]="profile$ | async" [user]="user$ | async" />

    <main class="page">
      <mat-toolbar class="toolbar">
        <button (click)="nav.toggle()" [disabled]="!sink.user" mat-icon-button>
          <fa-icon [icon]="['fas', 'bars']" size="2x"></fa-icon>
        </button>

        <h1>
          @if (title) {
            {{ title }}
          }
        </h1>

        <button (click)="redo()" [disabled]="!canRedo" mat-icon-button>
          <fa-icon [icon]="['fad', 'redo']" size="2x"></fa-icon>
        </button>

        <button (click)="undo()" [disabled]="!canUndo" mat-icon-button>
          <fa-icon [icon]="['fad', 'undo']" size="2x"></fa-icon>
        </button>

        @if (sink.user) {
          <app-avatar
            (click)="setup.toggle()"
            [name]="sink.user.displayName"
            class="avatar"></app-avatar>
        }
      </mat-toolbar>

      @if (loading || working) {
        <mat-progress-bar
          color="primary"
          mode="indeterminate"></mat-progress-bar>
      }

      <mat-drawer-container class="container">
        <mat-drawer #nav class="sidebar" mode="over" position="start">
          <app-navigator [title]="title"></app-navigator>
        </mat-drawer>

        <mat-drawer #setup class="sidebar" mode="over" position="end">
          @if (sink.user) {
            @if (sink.profile) {
              <app-profile
                [profile]="sink.profile"
                [user]="sink.user"></app-profile>
            }
          }
        </mat-drawer>

        <mat-drawer-content [@moveFromLeftFade]="getState()" class="content">
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

      .avatar {
        cursor: pointer;
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

      .page {
        height: 100%;
        overflow: hidden;
        position: absolute;
        width: 100%;
      }

      .sidebar {
        height: 100%;
      }

      .toolbar {
        display: grid;
        grid-template-columns: auto 1fr auto auto auto auto;
        height: calc(var(--map-cy-toolbar) * 1px);
        padding: 0 0.5rem !important;
        position: absolute;
        width: 100%;
      }
    `
  ]
})
export class RootPage implements OnInit {
  @Select(MapState) mapState$: Observable<Map>;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  @Select(AuthState.user) user$: Observable<User>;

  _version = inject(VersionService) /* 👈 just to get it loaded */;

  canRedo = false;
  canUndo = false;
  loading = false;
  outlet = viewChild(RouterOutlet);
  title: string;
  working = 0;

  #actions$ = inject(Actions);
  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #dialog = inject(MatDialog);
  #router = inject(Router);
  #store = inject(Store);

  getState(): any {
    return this.outlet()?.activatedRouteData?.state;
  }

  ngOnInit(): void {
    this.#handleMapErrorActions$();
    this.#handleRouterEvents$();
    this.#handleUndoActions$();
    this.#handleWorkingActions$();
  }

  redo(): void {
    this.#store.dispatch(new Redo());
  }

  setTitle(title: string): void {
    this.title = title;
  }

  undo(): void {
    this.#store.dispatch(new Undo());
  }

  #handleMapErrorActions$(): void {
    this.#actions$
      .pipe(
        ofActionSuccessful(CreateMapError, UpdateMapError),
        takeUntil(this.#destroy$)
      )
      .subscribe((action: CreateMapError | UpdateMapError) => {
        const data: MessageDialogData = {
          message: action.error
        };
        this.#dialog.open(MessageDialogComponent, { data });
      });
  }

  #handleRouterEvents$(): void {
    this.#router.routeReuseStrategy.shouldReuseRoute = (): boolean => false;
    this.#router.events
      .pipe(takeUntil(this.#destroy$))
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
            this.#router.navigated = false;
            this.loading = false;
            // 👉 clear the "undo" stacks on a page transition
            this.#store.dispatch(new ClearStacks());
            break;
          }
          default: {
            break;
          }
        }
      });
  }

  #handleUndoActions$(): void {
    this.#actions$
      .pipe(takeUntil(this.#destroy$), ofActionSuccessful(CanDo))
      .subscribe((action: CanDo) => {
        this.canRedo = action.canRedo;
        this.canUndo = action.canUndo;
        this.#cdf.markForCheck();
      });
  }

  #handleWorkingActions$(): void {
    this.#actions$
      .pipe(takeUntil(this.#destroy$), ofActionSuccessful(Working))
      .subscribe((action: Working) => {
        this.working = Math.max(0, this.working + action.increment);
        console.log({ working: this.working });
        this.#cdf.markForCheck();
      });
  }
}
