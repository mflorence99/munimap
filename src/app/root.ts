import { AuthState } from './state/auth';
import { User } from './state/auth';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  styleUrls: ['./root.scss'],
  templateUrl: './root.html'
})
export class RootPage {
  openUserProfile = false;

  @Select(AuthState.user) user$: Observable<User>;
}
