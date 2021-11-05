import { AuthState } from '../../state/auth';
import { CanDo } from '../../state/parcels';
import { DestroyService } from '../../services/destroy';
import { Map } from '../../state/map';
import { Profile } from '../../state/auth';
import { Redo } from '../../state/parcels';
import { TypeRegistry } from '../../services/typeregistry';
import { Undo } from '../../state/parcels';
import { User } from '../../state/auth';

import { Actions } from '@ngxs/store';
import { AngularFirestore } from '@angular/fire/firestore';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Event } from '@angular/router';
import { NavigationCancel } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { NavigationError } from '@angular/router';
import { NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { mergeMap } from 'rxjs/operators';
import { moveFromLeftFade } from 'ngx-router-animations';
import { of } from 'rxjs';
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
  styleUrls: ['./root.scss'],
  templateUrl: './root.html'
})
export class RootPage implements OnInit {
  allMaps$: Observable<Map[]>;

  canRedo = false;
  canUndo = false;

  loading = false;
  openUserProfile = false;

  @ViewChild(RouterOutlet) outlet;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  title: string;

  @Select(AuthState.user) user$: Observable<User>;

  constructor(
    private actions$: Actions,
    private cdf: ChangeDetectorRef,
    private firestore: AngularFirestore,
    private destroy$: DestroyService,
    public registry: TypeRegistry,
    private router: Router,
    private store: Store
  ) {}

  #handleActions$(): void {
    this.actions$
      .pipe(takeUntil(this.destroy$), ofActionSuccessful(CanDo))
      .subscribe((action: CanDo) => {
        console.log({ action });
        this.canRedo = action.canRedo;
        this.canUndo = action.canUndo;
        this.cdf.detectChanges();
      });
  }

  #handleAllMaps$(): Observable<Map[]> {
    return this.profile$.pipe(
      takeUntil(this.destroy$),
      mergeMap((profile) => {
        if (!profile?.email) return of([]);
        else {
          const workgroup = AuthState.workgroup(profile);
          const query = (ref): any =>
            ref.where('owner', 'in', workgroup).orderBy('name');
          return this.firestore.collection<Map>('maps', query).valueChanges();
        }
      })
    );
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
    this.allMaps$ = this.#handleAllMaps$();
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
