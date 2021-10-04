import { AuthState } from './state/auth';
import { User } from './state/auth';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { RouterOutlet } from '@angular/router';
import { Select } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { moveFromLeftFade } from 'ngx-router-animations';
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
  openUserProfile = false;

  @ViewChild(RouterOutlet) outlet;

  @Select(AuthState.user) user$: Observable<User>;

  getState(): any {
    console.log({ state: this.outlet?.activatedRouteData });
    return this.outlet?.activatedRouteData?.state;
  }
}
