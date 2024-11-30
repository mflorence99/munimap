import { Auth } from '@angular/fire/auth';
import { AuthActions } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@lib/components/message-dialog';
import { MessageDialogData } from '@lib/components/message-dialog';
import { Store } from '@ngxs/store';

import { createUserWithEmailAndPassword } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { sendPasswordResetEmail } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  template: `
    <!-- 📦 INITIAL STATE - REQUEST EMAIL -->

    @if (state === 'initial') {
      <mat-card appearance="outlined" class="card">
        <mat-card-header>
          <fa-icon
            [icon]="['fad', 'sign-in']"
            mat-card-avatar
            size="3x"></fa-icon>
          <mat-card-title>Please Login or Signup</mat-card-title>
          <mat-card-subtitle>First, enter your email address</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form
            #loginForm="ngForm"
            (submit)="checkUserExists()"
            class="form"
            id="loginForm"
            novalidate
            spellcheck="false">
            <mat-form-field>
              <mat-label>Email Address</mat-label>
              <input
                #emailAddress="ngModel"
                [(ngModel)]="login.emailAddress"
                [appAutoFocus]="true"
                [appSelectOnFocus]="true"
                appEmailAddress
                autocomplete="off"
                matInput
                name="emailAddress"
                required
                type="text" />
              @if (emailAddress.errors) {
                <mat-error>
                  Email address is required and must be valid
                </mat-error>
              }
            </mat-form-field>

            @if (errorMessage) {
              <mat-error>{{ errorMessage }}</mat-error>
            }
          </form>
        </mat-card-content>

        <mat-card-actions class="actions">
          <button
            [disabled]="loginForm.invalid || !loginForm.dirty"
            color="primary"
            form="loginForm"
            mat-flat-button
            type="submit">
            Next
          </button>
        </mat-card-actions>
      </mat-card>
    }

    <!-- 📦 LOGIN STATE -->

    @if (state === 'login') {
      <mat-card appearance="outlined" class="card">
        <mat-card-header>
          <fa-icon
            [icon]="['fad', 'sign-in']"
            mat-card-avatar
            size="3x"></fa-icon>
          <mat-card-title>Please Login</mat-card-title>
          <mat-card-subtitle>
            Next, enter your password.
            <a (click)="resetPassword()">Forgot your password?</a>
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form
            #loginForm="ngForm"
            (submit)="logIn()"
            class="form"
            id="loginForm"
            novalidate
            spellcheck="false">
            <mat-form-field>
              <mat-label>Email Address</mat-label>
              <input
                #emailAddress="ngModel"
                [(ngModel)]="login.emailAddress"
                disabled
                matInput
                name="emailAddress"
                type="text" />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Password</mat-label>
              <input
                #password="ngModel"
                [(ngModel)]="login.password"
                [appAutoFocus]="true"
                [appSelectOnFocus]="true"
                autocomplete="off"
                matInput
                name="password"
                required
                type="password" />
            </mat-form-field>

            @if (errorMessage) {
              <mat-error>{{ errorMessage }}</mat-error>
            }
          </form>
        </mat-card-content>

        <mat-card-actions class="actions">
          <a (click)="startOver()" mat-flat-button>Start Over</a>

          <div class="filler"></div>

          <button
            [disabled]="loginForm.invalid || !loginForm.dirty"
            color="primary"
            form="loginForm"
            mat-flat-button
            type="submit">
            Login
          </button>
        </mat-card-actions>
      </mat-card>
    }

    <!-- 📦 SIGNUP STATE -->

    @if (state === 'signup') {
      <mat-card appearance="outlined" class="card">
        <mat-card-header>
          <fa-icon
            [icon]="['fad', 'sign-in']"
            mat-card-avatar
            size="3x"></fa-icon>
          <mat-card-title>Signup for a New Account</mat-card-title>
          <mat-card-subtitle>Enter your account details</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form
            #loginForm="ngForm"
            (submit)="signUp()"
            class="form"
            id="loginForm"
            novalidate
            spellcheck="false">
            <mat-form-field>
              <mat-label>Email Address</mat-label>
              <input
                #emailAddress="ngModel"
                [(ngModel)]="login.emailAddress"
                disabled
                matInput
                name="emailAddress"
                type="text" />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Display Name</mat-label>
              <input
                #displayName="ngModel"
                [(ngModel)]="login.displayName"
                [appAutoFocus]="true"
                [appSelectOnFocus]="true"
                autocomplete="off"
                matInput
                name="displayName"
                required
                type="text" />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Password</mat-label>
              <input
                #password="ngModel"
                [(ngModel)]="login.password"
                [appSelectOnFocus]="true"
                autocomplete="off"
                matInput
                name="password"
                required
                type="password" />
            </mat-form-field>

            @if (errorMessage) {
              <mat-error>{{ errorMessage }}</mat-error>
            }
          </form>
        </mat-card-content>

        <mat-card-actions class="actions">
          <a (click)="startOver()" mat-flat-button>Start Over</a>

          <div class="filler"></div>

          <button
            [disabled]="loginForm.invalid || !loginForm.dirty"
            color="primary"
            form="loginForm"
            mat-flat-button
            type="submit">
            Sign up
          </button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: [
    `
      :host {
        align-items: flex-start;
        display: flex;
        height: 100%;
        justify-content: center;
        position: absolute;
        width: 100%;
      }

      .actions {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        justify-content: flex-end;
        padding: 16px;
      }

      .card {
        margin-top: 5rem;
        width: 30rem;
      }

      .filler {
        flex-grow: 1;
      }

      .form {
        display: grid;
        gap: 1rem;

        .mat-mdc-form-field {
          width: 100%;
        }
      }
    `
  ],
  standalone: false
})
export class LoginPage {
  errorMessage = '';

  login = {
    displayName: '',
    emailAddress: '',
    password: ''
  };

  state: 'initial' | 'login' | 'signup' = 'initial';

  #cdf = inject(ChangeDetectorRef);
  #dialog = inject(MatDialog);
  #fireauth = inject(Auth);
  #store = inject(Store);

  // 👇 trial login with impossible password to see if user exists
  checkUserExists(): void {
    signInWithEmailAndPassword(
      this.#fireauth,
      this.login.emailAddress,
      String(Math.random())
    )
      .then(() => console.error('Should not happen!'))
      .catch((error) => {
        if (error.code === 'auth/user-not-found') this.state = 'signup';
        else this.state = 'login';
        this.#cdf.detectChanges();
      });
  }

  logIn(): void {
    this.errorMessage = null;
    signInWithEmailAndPassword(
      this.#fireauth,
      this.login.emailAddress,
      this.login.password
    )
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(
          `%cFirestore auth: login ${user.email}`,
          'color: goldenrod'
        );
      })
      .catch(() => {
        // 👇 the Firebase error message isn't that helpful
        //    this.errorMessage = this.#extractFirebaseMessage(error.message);
        this.errorMessage = 'Email address and password invalid';
        this.#cdf.detectChanges();
      });
  }

  resetPassword(): void {
    sendPasswordResetEmail(this.#fireauth, this.login.emailAddress).then(() => {
      const data: MessageDialogData = {
        message: `An email has been sent to ${this.login.emailAddress} from which your password can be reset`
      };
      this.#dialog.open(MessageDialogComponent, { data });
    });
  }

  signUp(): void {
    this.errorMessage = null;
    createUserWithEmailAndPassword(
      this.#fireauth,
      this.login.emailAddress,
      this.login.password
    )
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(
          `%cFirestore auth: signup ${user.email}`,
          'color: goldenrod'
        );
        this.#store.dispatch(
          new AuthActions.UpdateUser({
            ...user,
            displayName: this.login.displayName,
            photoURL: ''
          })
        );
      })
      .catch((error) => {
        this.errorMessage = this.#extractFirebaseMessage(error.message);
        this.#cdf.detectChanges();
      });
  }

  startOver(): void {
    this.errorMessage = null;
    this.state = 'initial';
  }

  #extractFirebaseMessage(message: any): string {
    const match = message.match(/^Firebase: ([^(]*)/);
    return match ? match[1] : message;
  }
}
