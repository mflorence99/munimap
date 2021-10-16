import { OLStylerFeatureService } from '../ol/ol-styler-feature';
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
  selector: 'app-create',
  styleUrls: ['./create.scss'],
  templateUrl: './create.html'
})
export class CreatePage {
  @Select(ViewState.view) view$: Observable<View>;

  constructor(
    private store: Store,
    public olStylerFeature: OLStylerFeatureService
  ) {}

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
