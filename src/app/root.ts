import { AuthState } from './state/auth';
import { Map } from './state/map';
import { Profile } from './state/auth';
import { User } from './state/auth';

import { AngularFirestore } from '@angular/fire/firestore';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Event } from '@angular/router';
import { NavigationCancel } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { NavigationError } from '@angular/router';
import { NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Select } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { moveFromLeftFade } from 'ngx-router-animations';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
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
  selector: 'app-root',
  styleUrls: ['./root.scss'],
  templateUrl: './root.html'
})
export class RootPage {
  allMaps$: Observable<Map[]>;

  loading = false;
  openUserProfile = false;

  @ViewChild(RouterOutlet) outlet;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  title: string;

  @Select(AuthState.user) user$: Observable<User>;

  constructor(private firestore: AngularFirestore, private router: Router) {
    this.#handleRouterEvents$();
    this.#makeAllMaps$();
  }

  #handleRouterEvents$(): void {
    this.router.events.subscribe((event: Event) => {
      switch (true) {
        case event instanceof NavigationStart: {
          this.loading = true;
          break;
        }
        case event instanceof NavigationEnd:
        case event instanceof NavigationCancel:
        case event instanceof NavigationError: {
          this.loading = false;
          break;
        }
        default: {
          break;
        }
      }
    });
  }

  #makeAllMaps$(): void {
    this.allMaps$ = this.profile$.pipe(
      switchMap((profile) => {
        if (!profile?.email) return of([]);
        else {
          let owners = [profile.email];
          if (profile.workgroup)
            owners = owners.concat(profile.workgroup.split('\n'));
          const query = (ref): any =>
            ref.where('owner', 'in', owners).orderBy('name');
          return this.firestore.collection<Map>('maps', query).valueChanges();
        }
      }),
      tap(console.error)
    );
  }

  getState(): any {
    return this.outlet?.activatedRouteData?.state;
  }

  setTitle(title: string): void {
    this.title = title;
  }
}
