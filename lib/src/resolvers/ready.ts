import { AnonState } from '../state/anon';
import { AuthState } from '../state/auth';
import { Profile } from '../state/auth';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';
import { Store } from '@ngxs/store';

import { filter } from 'rxjs/operators';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { merge } from 'rxjs';
import { take } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ReadyResolver implements Resolve<boolean> {
  profile1$: Observable<Profile>;
  profile2$: Observable<Profile>;

  #store = inject(Store);

  constructor() {
    // 👇 remember that that author app uses regular logins,
    //    while the viewer app uses anonymous logins --
    //    we don't care which here
    this.profile1$ = this.#store.select(AnonState.profile);
    this.profile2$ = this.#store.select(AuthState.profile);
  }

  resolve(): Observable<boolean> {
    const either$ = merge(this.profile1$, this.profile2$);
    return either$.pipe(
      map((profile) => !!profile),
      filter((ready) => ready),
      tap(() => {
        const root = document.querySelector('app-root');
        root.classList.add('ready');
      }),
      take(1)
    );
  }
}
