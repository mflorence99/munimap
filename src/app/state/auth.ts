import { Action } from '@ngxs/store';
import { AngularFireAuth } from '@angular/fire/auth';
import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Navigate } from '@ngxs/router-plugin';
import { NgxsOnInit } from '@ngxs/store';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import firebase from 'firebase/app';

export class Logout {
  static readonly type = '[Auth] Logout';
}

export class SetUser {
  static readonly type = '[Auth] SetUser';
  constructor(public user: firebase.User | User | null) {}
}

export class UpdateUser {
  static readonly type = '[Auth] UpdateUser';
  constructor(public user: UpdateUser) {}
}

export interface User {
  displayName: string;
  email: string;
  photoURL: string;
}

export interface AuthStateModel {
  user: User;
}

@State<AuthStateModel>({
  name: 'auth',
  defaults: {
    user: null
  }
})
@Injectable()
export class AuthState implements NgxsOnInit {
  constructor(
    private fireauth: AngularFireAuth,
    private location: Location,
    private store: Store
  ) {}

  @Selector() static user(state: AuthStateModel): User {
    return state.user;
  }

  @Action(Logout) logout(): void {
    this.fireauth.signOut();
    // 👉 side-effect triggers subscribe in ngxsOnInit
  }

  ngxsOnInit(ctx: StateContext<AuthStateModel>): void {
    const deepLink = this.location.path();
    const lastRoute = this.store.snapshot().router?.state.url;
    const forwardTo = deepLink || lastRoute || '/maps';
    this.fireauth.user.subscribe((user) => {
      ctx.dispatch(new SetUser(user));
      ctx.dispatch(new Navigate([user ? forwardTo : '/login']));
    });
  }

  @Action(SetUser) setUser(
    ctx: StateContext<AuthStateModel>,
    action: SetUser
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      user: action.user
        ? {
            displayName: action.user.displayName,
            email: action.user.email,
            photoURL: action.user.photoURL
          }
        : null
    });
  }

  @Action(UpdateUser) updateUser(
    ctx: StateContext<AuthStateModel>,
    action: SetUser
  ): void {
    this.fireauth.currentUser.then((user) => {
      user.updateProfile(action.user);
      ctx.dispatch(new SetUser(action.user));
    });
  }
}
