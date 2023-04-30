import { Auth } from '@angular/fire/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Logout } from '@lib/state/auth';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Profile } from '@lib/state/auth';
import { Store } from '@ngxs/store';
import { UpdateProfile } from '@lib/state/auth';
import { UpdateUser } from '@lib/state/auth';
import { User } from '@lib/state/auth';
import { ViewChild } from '@angular/core';

import { updatePassword } from '@angular/fire/auth';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  styleUrls: ['../../../../../lib/css/sidebar.scss', './profile.scss'],
  templateUrl: './profile.html'
})
export class ProfileComponent {
  @ViewChild('profileForm') profileForm: NgForm;

  errorMessage = '';

  #profile: Profile;
  #user: User;

  constructor(
    private cdf: ChangeDetectorRef,
    private fireauth: Auth,
    private drawer: MatDrawer,
    private store: Store
  ) {}

  @Input() get profile(): Profile {
    return this.#profile;
  }

  @Input() get user(): User {
    return this.#user;
  }

  set profile(profile: Profile) {
    this.#profile = copy(profile);
  }

  set user(user: User) {
    this.#user = copy(user);
  }

  cancel(): void {
    this.drawer.close();
  }

  logout(): void {
    this.store.dispatch(new Logout());
    this.drawer.close();
  }

  update(user: any, profile: any): void {
    this.errorMessage = null;
    this.store.dispatch(new UpdateUser(user));
    this.store.dispatch(new UpdateProfile(profile));
    // 👇 special code to change password
    if (user.password) {
      updatePassword(this.fireauth.currentUser, this.user.password).catch(
        (error) => {
          this.errorMessage = this.#extractFirebaseMessage(error.message);
          this.cdf.detectChanges();
        }
      );
    }
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.profileForm.form.markAsPristine();
  }

  #extractFirebaseMessage(message: any): string {
    const match = message.match(/^Firebase: ([^(]*)/);
    return match ? match[1] : message;
  }
}
