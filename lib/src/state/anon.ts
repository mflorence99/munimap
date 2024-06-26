import { AuthState } from './auth';
import { AuthStateModel } from './auth';
import { Profile } from './auth';
import { User } from './auth';
import { User as FirebaseUser } from './auth';

import { profileProps } from './auth';
import { userProps } from './auth';

import { Action } from '@ngxs/store';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { doc } from '@angular/fire/firestore';
import { getDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { signInAnonymously } from '@angular/fire/auth';

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
  constructor(public user: FirebaseUser | User | null) {}
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
  #fireauth = inject(Auth);
  #firestore = inject(Firestore);
  #store = inject(Store);

  @Action(LoadProfile) loadProfile(
    ctx: StateContext<AnonStateModel>,
    action: LoadProfile
  ): void {
    console.log(
      `%cFirestore get: profiles ${action.email}`,
      'color: goldenrod'
    );
    const docRef = doc(this.#firestore, 'profiles', action.email);
    getDoc(docRef).then((doc) => {
      ctx.dispatch(new SetProfile(doc.data() as Profile));
    });
  }

  @Selector() static profile(state: AnonStateModel): Profile {
    return state.profile;
  }

  @Action(SetProfile) setProfile(
    ctx: StateContext<AnonStateModel>,
    action: SetProfile
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      profile: profileProps(action.profile)
    });
  }

  @Action(SetUser) setUser(
    ctx: StateContext<AnonStateModel>,
    action: SetUser
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      user: action.user ? userProps(action.user) : null
    });
  }

  @Selector() static user(state: AnonStateModel): User {
    return state.user;
  }

  currentProfile(): Profile {
    return this.#store.selectSnapshot<Profile>(AuthState.profile);
  }

  currentUser(): User {
    return this.#store.selectSnapshot<User>(AuthState.user);
  }

  ngxsOnInit(ctx: StateContext<AnonStateModel>): void {
    signInAnonymously(this.#fireauth)
      .then(() => {
        ctx.dispatch(new SetUser({} as User));
      })
      .catch(() => {
        ctx.dispatch(new SetUser(null));
      });
  }
}
