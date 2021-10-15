import { MapState } from '../state/map';
import { PushCurrentPath } from '../state/map';
import { StyleService } from '../services/style';
import { View } from '../state/map';

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
  @Select(MapState.view) view$: Observable<View>;

  constructor(private store: Store, public style: StyleService) {}

  onSelect(part: string): void {
    this.store.dispatch(new PushCurrentPath(part));
  }
}
