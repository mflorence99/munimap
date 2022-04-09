import { AbstractMapPage } from '../abstract-map';
import { RootPage } from '../root/page';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MapType } from '@lib/state/map';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { ViewState } from '@lib/state/view';

// 🔥 we only expect "area" maps to be printed, never viewed in the viewer

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-property',
  styleUrls: ['./page.scss'],
  templateUrl: './page.html'
})
export class AreaPage extends AbstractMapPage {
  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  constructor(
    protected actions$: Actions,
    protected authState: AuthState,
    protected destroy$: DestroyService,
    protected root: RootPage,
    protected route: ActivatedRoute,
    protected router: Router,
    protected store: Store,
    protected viewState: ViewState
  ) {
    super(actions$, authState, destroy$, root, route, router, store, viewState);
  }

  getType(): MapType {
    return 'area';
  }
}
