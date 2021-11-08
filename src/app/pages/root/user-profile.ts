import { Logout } from '../../state/auth';
import { Profile } from '../../state/auth';
import { UpdateProfile } from '../../state/auth';
import { UpdateUser } from '../../state/auth';
import { User } from '../../state/auth';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Store } from '@ngxs/store';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-profile',
  styleUrls: ['./user-profile.scss'],
  templateUrl: './user-profile.html'
})
export class UserProfileComponent {
  #profile: Profile;
  #user: User;

  @Input()
  get profile(): Profile {
    return this.#profile;
  }
  set profile(profile: Profile) {
    this.#profile = copy(profile);
  }

  @Input()
  get user(): User {
    return this.#user;
  }
  set user(user: User) {
    this.#user = copy(user);
  }

  constructor(private drawer: MatDrawer, private store: Store) {}

  logout(): void {
    this.store.dispatch(new Logout());
    this.drawer.close();
  }

  update(user: any, profile: any): void {
    this.store.dispatch(new UpdateUser(user));
    this.store.dispatch(new UpdateProfile(profile));
    this.drawer.close();
  }
}
