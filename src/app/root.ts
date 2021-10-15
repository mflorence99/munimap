import { AuthState } from './state/auth';
import { Path } from './state/view';
import { StyleService } from './services/style';
import { User } from './state/auth';
import { View } from './state/view';
import { ViewState } from './state/view';

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
  loading = false;
  openUserProfile = false;

  @ViewChild(RouterOutlet) outlet;

  @Select(AuthState.user) user$: Observable<User>;
  @Select(ViewState.view) view$: Observable<View>;

  // 👉 need to bootup style service
  constructor(private router: Router, private style: StyleService) {
    this.#handleRouterEvents$();
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

  getState(): any {
    return this.outlet?.activatedRouteData?.state;
  }

  tail(path: Path): string {
    const parts = ViewState.splitPath(path);
    return parts[parts.length - 1];
  }
}
