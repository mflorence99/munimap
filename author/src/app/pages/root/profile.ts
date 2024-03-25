import { Auth } from '@angular/fire/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Logout } from '@lib/state/auth';
import { MatDrawer } from '@angular/material/sidenav';
import { Profile } from '@lib/state/auth';
import { Store } from '@ngxs/store';
import { UpdateProfile } from '@lib/state/auth';
import { UpdateUser } from '@lib/state/auth';
import { User } from '@lib/state/auth';

import { computed } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { updatePassword } from '@angular/fire/auth';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  template: `
    <header class="header">
      <app-avatar [name]="userCopy().displayName" class="icon"></app-avatar>
      <p class="title">{{ userCopy().displayName || '&nbsp;' }}</p>
      <p class="subtitle">{{ userCopy().email }}</p>
    </header>

    <form
      #profileForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="update(userCopy(), profileCopy())"
      class="form"
      id="profileForm"
      novalidate
      spellcheck="false">
      <mat-form-field>
        <mat-label>Display Name</mat-label>
        <input
          #displayName="ngModel"
          [(ngModel)]="userCopy().displayName"
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
          [(ngModel)]="profileCopy().workgroup"
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
          [(ngModel)]="userCopy().password"
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

      <button (click)="cancel()" mat-flat-button>CANCEL</button>

      <button
        [disabled]="profileForm.invalid || !profileForm.dirty"
        color="primary"
        form="profileForm"
        mat-flat-button
        type="submit">
        UPDATE
      </button>
    </article>
  `
})
export class ProfileComponent {
  errorMessage = '';
  profile = input<Profile>();
  profileCopy = computed(() => copy(this.profile()));
  user = input<User>();
  userCopy = computed(() => copy(this.user()));

  #cdf = inject(ChangeDetectorRef);
  #drawer = inject(MatDrawer);
  #fireauth = inject(Auth);
  #store = inject(Store);

  cancel(): void {
    this.#drawer.close();
  }

  logout(): void {
    this.#store.dispatch(new Logout());
    this.#drawer.close();
  }

  update(user: User, profile: Profile): void {
    this.errorMessage = null;
    this.#store.dispatch([new UpdateUser(user), new UpdateProfile(profile)]);
    // 👇 special code to change password
    if (user.password) {
      updatePassword(this.#fireauth.currentUser, user.password).catch(
        (error) => {
          this.errorMessage = this.#extractFirebaseMessage(error.message);
          this.#cdf.detectChanges();
        }
      );
    }
  }

  #extractFirebaseMessage(message: any): string {
    const match = message.match(/^Firebase: ([^(]*)/);
    return match ? match[1] : message;
  }
}
