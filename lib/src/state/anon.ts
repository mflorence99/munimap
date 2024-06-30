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

const ACTION_SCOPE = 'Anon';

export namespace AnonActions {
  export class LoadProfile {
    static readonly type = `[${ACTION_SCOPE}] LoadProfile`;
    constructor(public email: string) {}
  }

  export class SetProfile {
    static readonly type = `[${ACTION_SCOPE}] SetProfile`;
    constructor(public profile: Profile) {}
  }

  export class SetUser {
    static readonly type = `[${ACTION_SCOPE}] SetUser`;
    constructor(public user: FirebaseUser | User | null) {}
  }
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

  @Action(AnonActions.LoadProfile) loadProfile(
    ctx: StateContext<AnonStateModel>,
    action: AnonActions.LoadProfile
  ): void {
    console.log(
      `%cFirestore get: profiles ${action.email}`,
      'color: goldenrod'
    );
    const docRef = doc(this.#firestore, 'profiles', action.email);
    getDoc(docRef).then((doc) => {
      ctx.dispatch(new AnonActions.SetProfile(doc.data() as Profile));
    });
  }

  @Selector() static profile(state: AnonStateModel): Profile {
    return state.profile;
  }

  @Action(AnonActions.SetProfile) setProfile(
    ctx: StateContext<AnonStateModel>,
    action: AnonActions.SetProfile
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      profile: profileProps(action.profile)
    });
  }

  @Action(AnonActions.SetUser) setUser(
    ctx: StateContext<AnonStateModel>,
    action: AnonActions.SetUser
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
        ctx.dispatch(new AnonActions.SetUser({} as User));
      })
      .catch(() => {
        ctx.dispatch(new AnonActions.SetUser(null));
      });
  }
}
