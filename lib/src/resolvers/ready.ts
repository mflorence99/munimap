import { AuthState } from '../state/auth';
import { Profile } from '../state/auth';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';
import { Select } from '@ngxs/store';

import { filter } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ReadyResolver implements Resolve<boolean> {
  @Select(AuthState.profile) profile$: Observable<Profile>;

  resolve(): Observable<boolean> {
    return this.profile$.pipe(
      map((profile) => !!profile),
      filter((ready) => ready),
      take(1)
    );
  }
}
