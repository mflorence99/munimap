import { Map } from '@lib/state/map';
import { Observable } from 'rxjs';
import { ViewStateModel } from '@lib/state/view';

import { combineLatest } from 'rxjs';
import { environment } from '@lib/environment';
import { map } from 'rxjs/operators';

export abstract class AbstractMapPage {
  env = environment;
  gps$: Observable<boolean>;
  map$: Observable<Map>;
  satelliteView$: Observable<boolean>;
  satelliteYear$: Observable<string>;
  view$: Observable<ViewStateModel>;
  zoom$: Observable<number>;

  onInit(): void {
    this.zoom$ = combineLatest([this.map$, this.view$]).pipe(
      // 💣 sometimes triggered by ???
      map(([map, view]) => view.viewByPath[map.path]?.zoom ?? 15)
    );
  }
}
