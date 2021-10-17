import { Path } from '../state/view';
import { PushCurrentPath } from '../state/view';
import { View } from '../state/view';
import { ViewState } from '../state/view';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map-create',
  styleUrls: ['./map-create.scss'],
  templateUrl: './map-create.html'
})
export class MapCreatePage {
  @Select(ViewState.view) view$: Observable<View>;

  constructor(private store: Store) {}

  atCountyLevel(path: Path): boolean {
    return ViewState.splitPath(path).length === 2;
  }

  atStateLevel(path: Path): boolean {
    return ViewState.splitPath(path).length === 1;
  }

  atTownLevel(path: Path): boolean {
    return ViewState.splitPath(path).length === 3;
  }

  onSelect(part: string): void {
    this.store.dispatch(new PushCurrentPath(part));
  }
}
