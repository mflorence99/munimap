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
  template: `
    <header class="header">
      <app-avatar [name]="user.displayName" class="icon"></app-avatar>

      <p class="title">{{ user.displayName || '&nbsp;' }}</p>
      <p class="subtitle">{{ user.email }}</p>
    </header>

    <form
      #profileForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="update(user, profile)"
      class="form"
      id="profileForm"
      novalidate
      spellcheck="false">
      <mat-form-field>
        <mat-label>Display Name</mat-label>
        <input
          #displayName="ngModel"
          [(ngModel)]="user.displayName"
          [appAutoFocus]="true"
          [appSelectOnFocus]="true"
          autocomplete="off"
          matInput
          name="displayName"
          required
          type="text" />
        @if (displayName.errors) {
          <mat-error>A display name is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Workgroup</mat-label>
        <textarea
          #workgroup="ngModel"
          [(ngModel)]="profile.workgroup"
          appWorkgroup
          autocomplete="off"
          cdkTextareaAutosize
          matInput
          name="workgroup"></textarea>
        @if (workgroup.errors?.tooMany) {
          <mat-error>A maximum of 10 email addresses is allowed.</mat-error>
        }
        @if (workgroup.errors?.invalidEmail) {
          <mat-error>At least one email address is invalid.</mat-error>
        }
        @if (!workgroup.errors) {
          <mat-hint>
            Give the email addresses of up to 10 colleagues with whom you share
            maps, each on a new line.
          </mat-hint>
        }
      </mat-form-field>

      <br />

      <mat-form-field>
        <mat-label>New Password</mat-label>
        <input
          #password="ngModel"
          [(ngModel)]="user.password"
          autocomplete="off"
          matInput
          name="password"
          type="password" />
      </mat-form-field>

      @if (errorMessage) {
        <mat-error>{{ errorMessage }}</mat-error>
      }
    </form>

    <article class="actions">
      <a (click)="logout()" mat-flat-button>Sign Out</a>

      <div class="filler"></div>

      <button (click)="cancel()" mat-flat-button>DONE</button>

      <button
        [disabled]="profileForm.invalid || !profileForm.dirty"
        color="primary"
        form="profileForm"
        mat-flat-button
        type="submit">
        UPDATE
      </button>
    </article>
  `,
  styleUrls: ['../../../../../lib/css/sidebar.scss']
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
