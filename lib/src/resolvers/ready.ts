import { AnonState } from '../state/anon';
import { AuthState } from '../state/auth';
import { Profile } from '../state/auth';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';
import { Select } from '@ngxs/store';

import { filter } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { merge } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ReadyResolver implements Resolve<boolean> {
  // 👇 remember that that author app uses regular logins,
  //    while the viewer app uses anonymous logins --
  //    we don't care which here
  @Select(AnonState.profile) profile1$: Observable<Profile>;
  @Select(AuthState.profile) profile2$: Observable<Profile>;

  resolve(): Observable<boolean> {
    const either$ = merge(this.profile1$, this.profile2$);
    return either$.pipe(
      map((profile) => !!profile),
      filter((ready) => ready),
      take(1)
    );
  }
}
