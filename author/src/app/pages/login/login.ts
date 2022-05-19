import { Auth } from '@angular/fire/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@lib/components/message-dialog';
import { MessageDialogData } from '@lib/components/message-dialog';
import { NgForm } from '@angular/forms';
import { Store } from '@ngxs/store';
import { UpdateUser } from '@lib/state/auth';
import { ViewChild } from '@angular/core';

import { createUserWithEmailAndPassword } from '@angular/fire/auth';
import { sendPasswordResetEmail } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  styleUrls: ['./login.scss'],
  templateUrl: './login.html'
})
export class LoginPage {
  errorMessage = '';

  login = {
    displayName: '',
    emailAddress: '',
    password: ''
  };

  @ViewChild('loginForm') loginForm: NgForm;

  state: 'initial' | 'login' | 'signup' = 'initial';

  constructor(
    private cdf: ChangeDetectorRef,
    private dialog: MatDialog,
    private fireauth: Auth,
    private store: Store
  ) {}

  #extractFirebaseMessage(message: any): string {
    const match = message.match(/^Firebase: ([^(]*)/);
    return match ? match[1] : message;
  }

  // 👇 trial login with impossible password to see if user exists
  checkUserExists(): void {
    signInWithEmailAndPassword(
      this.fireauth,
      this.login.emailAddress,
      String(Math.random())
    )
      .then(() => console.error('Should not happen!'))
      .catch((error) => {
        if (error.code === 'auth/user-not-found') this.state = 'signup';
        else this.state = 'login';
        this.cdf.detectChanges();
        // 👇 set focus to first input that isn't disabled
        setTimeout(() => {
          const form = document.forms[0];
          const input: any = form.querySelector('input:not([disabled])');
          input.focus();
        }, 0);
      });
  }

  logIn(): void {
    signInWithEmailAndPassword(
      this.fireauth,
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
      .catch((error) => {
        this.errorMessage = this.#extractFirebaseMessage(error.message);
        this.cdf.detectChanges();
      });
  }

  resetPassword(): void {
    sendPasswordResetEmail(this.fireauth, this.login.emailAddress).then(() => {
      const data: MessageDialogData = {
        message: `An email has been sent to ${this.login.emailAddress} from which your password can be reset`
      };
      this.dialog.open(MessageDialogComponent, { data });
    });
  }

  signUp(): void {
    this.errorMessage = null;
    createUserWithEmailAndPassword(
      this.fireauth,
      this.login.emailAddress,
      this.login.password
    )
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(
          `%cFirestore auth: signup ${user.email}`,
          'color: goldenrod'
        );
        this.store.dispatch(
          new UpdateUser({
            ...user,
            displayName: this.login.displayName,
            photoURL: ''
          })
        );
      })
      .catch((error) => {
        this.errorMessage = this.#extractFirebaseMessage(error.message);
        this.cdf.detectChanges();
      });
  }

  startOver(): void {
    this.state = 'initial';
  }
}
