import { AuthState } from './auth';
import { AuthStateModel } from './auth';
import { Profile } from './auth';
import { User } from './auth';

import { Action } from '@ngxs/store';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFirestoreCollection } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import firebase from 'firebase/app';

export class LoadProfile {
  static readonly type = '[Anon] LoadProfile';
  constructor(public email: string) {}
}

export class SetProfile {
  static readonly type = '[Anon] SetProfile';
  constructor(public profile: Profile) {}
}

export class SetUser {
  static readonly type = '[Anon] SetUser';
  constructor(public user: firebase.User | User | null) {}
}

export type AnonStateModel = AuthStateModel;

@State<AnonStateModel>({
  name: 'anon',
  defaults: {
    profile: null,
    user: null
  }
})
@Injectable()
export class AnonState implements NgxsOnInit {
  #profiles: AngularFirestoreCollection<Profile>;

  constructor(
    private fireauth: AngularFireAuth,
    private firestore: AngularFirestore,
    private store: Store
  ) {
    this.#profiles = this.firestore.collection<Profile>('profiles');
  }

  @Selector() static profile(state: AnonStateModel): Profile {
    return state.profile;
  }

  @Selector() static user(state: AnonStateModel): User {
    return state.user;
  }

  currentProfile(): Profile {
    return this.store.snapshot().auth.profile;
  }

  currentUser(): User {
    return this.store.snapshot().auth.user;
  }

  @Action(LoadProfile) loadProfile(
    ctx: StateContext<AnonStateModel>,
    action: LoadProfile
  ): void {
    console.log(
      `%cFirestore get: profiles ${action.email}`,
      'color: goldenrod'
    );
    this.#profiles
      .doc(action.email)
      .get()
      .subscribe((doc) => {
        ctx.dispatch(new SetProfile(doc.data()));
      });
  }

  ngxsOnInit(ctx: StateContext<AnonStateModel>): void {
    this.fireauth
      .signInAnonymously()
      .then(() => {
        ctx.dispatch(new SetUser({} as User));
      })
      .catch(() => {
        ctx.dispatch(new SetUser(null));
      });
  }

  @Action(SetProfile) setProfile(
    ctx: StateContext<AnonStateModel>,
    action: SetProfile
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      profile: AuthState.profileProps(action.profile)
    });
  }

  @Action(SetUser) setUser(
    ctx: StateContext<AnonStateModel>,
    action: SetUser
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      user: action.user ? AuthState.userProps(action.user) : null
    });
  }
}
