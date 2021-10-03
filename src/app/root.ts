import { AuthState } from './state/auth';
import { SetUser } from './state/auth';
import { User } from './state/auth';

import { AngularFireAuth } from '@angular/fire/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  styleUrls: ['./root.scss'],
  templateUrl: './root.html'
})
export class RootPage {
  openUserProfile = false;
  @Select(AuthState.user) user$: Observable<User>;

  constructor(private firebase: AngularFireAuth, private store: Store) {
    this.#handleAuth();
  }

  #handleAuth(): void {
    this.firebase.user.subscribe((user) =>
      this.store.dispatch(new SetUser(user))
    );
  }
}
