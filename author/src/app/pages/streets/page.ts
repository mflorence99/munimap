import { AbstractMapPage } from '../abstract-map';
import { RootPage } from '../root/page';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MapType } from '@lib/state/map';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { ViewState } from '@lib/state/view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-streets',
  styleUrls: ['../abstract-map.scss'],
  templateUrl: './page.html'
})
export class StreetsPage extends AbstractMapPage {
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
    return 'streets';
  }
}
