import { Action } from '@ngxs/store';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFirestoreCollection } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { NgxsOnInit } from '@ngxs/store';
import { Router } from '@angular/router';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { forkJoin } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';

import firebase from 'firebase/app';

export class Logout {
  static readonly type = '[Auth] Logout';
}

export class SetProfile {
  static readonly type = '[Auth] SetProfile';
  constructor(public profile: Profile) {}
}

export class SetUser {
  static readonly type = '[Auth] SetUser';
  constructor(public user: firebase.User | User | null) {}
}

export class UpdateProfile {
  static readonly type = '[Auth] UpdateProfile';
  constructor(public profile: Profile) {}
}

export class UpdateUser {
  static readonly type = '[Auth] UpdateUser';
  constructor(public user: User) {}
}

export interface Profile {
  email: string;
  workgroup: string;
}

export interface User {
  displayName: string;
  email: string;
  photoURL: string;
  uid: string;
}

export interface AuthStateModel {
  profile: Profile;
  user: User;
}

@State<AuthStateModel>({
  name: 'auth',
  defaults: {
    profile: null,
    user: null
  }
})
@Injectable()
export class AuthState implements NgxsOnInit {
  #profiles: AngularFirestoreCollection<Profile>;

  constructor(
    private fireauth: AngularFireAuth,
    private firestore: AngularFirestore,
    private location: Location,
    private store: Store,
    private router: Router
  ) {
    this.#profiles = this.firestore.collection<Profile>('profiles');
  }

  @Selector() static profile(state: AuthStateModel): Profile {
    return state.profile;
  }

  static profileProps(obj: any): any {
    return {
      email: obj.email,
      workgroup: obj.workgroup
    };
  }

  @Selector() static user(state: AuthStateModel): User {
    return state.user;
  }

  static userProps(obj: any): any {
    return {
      displayName: obj.displayName,
      email: obj.email,
      photoURL: obj.photoURL,
      uid: obj.uid
    };
  }

  static workgroup(profile: Profile): string[] {
    let workgroup = [profile.email];
    if (profile.workgroup)
      workgroup = workgroup
        .concat(profile.workgroup.split(/[\n ;]+/g))
        .filter((email) => !!email);
    return workgroup;
  }

  currentProfile(): Profile {
    return this.store.snapshot().auth.profile;
  }

  currentUser(): User {
    return this.store.snapshot().auth.user;
  }

  @Action(Logout) logout(): void {
    this.fireauth.signOut();
    // 👉 side-effect triggers subscribe in ngxsOnInit
  }

  ngxsOnInit(ctx: StateContext<AuthStateModel>): void {
    const deepLink = this.location.path();
    const lastRoute = this.store.snapshot().router?.state.url;
    // 👇 don't try to use ?? here, because deepLink and lastRoute
    //    are blank when empty, not null or undefined
    const forwardTo = deepLink || lastRoute || '/map_create';
    // 👉 the user will be NULL on logout!
    this.fireauth.user
      .pipe(
        // 👉 combine the user with its corresponding profile
        mergeMap((user) => {
          const profile$ = user
            ? this.#profiles.doc(user.email).get()
            : of(null);
          const user$ = of(user);
          return forkJoin(user$, profile$);
        })
      )
      .subscribe(([user, doc]) => {
        ctx.dispatch(new SetUser(user));
        if (user) {
          // 👉 set the profile corresponding to the User
          //    or an empty one if none found
          if (doc.exists) ctx.dispatch(new SetProfile(doc.data()));
          else
            ctx.dispatch(
              new UpdateProfile({ email: user.email, workgroup: '' })
            );
          this.router.navigateByUrl(forwardTo);
        } else this.router.navigateByUrl('/login');
      });
  }

  @Action(SetProfile) setProfile(
    ctx: StateContext<AuthStateModel>,
    action: SetProfile
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      profile: AuthState.profileProps(action.profile)
    });
  }

  @Action(SetUser) setUser(
    ctx: StateContext<AuthStateModel>,
    action: SetUser
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      user: action.user ? AuthState.userProps(action.user) : null
    });
  }

  @Action(UpdateProfile) updateProfile(
    ctx: StateContext<AuthStateModel>,
    action: UpdateProfile
  ): void {
    const user = ctx.getState().user;
    this.#profiles
      .doc(user.email)
      .set(AuthState.profileProps(action.profile), { merge: true })
      .then(() => ctx.dispatch(new SetProfile(action.profile)));
  }

  @Action(UpdateUser) updateUser(
    ctx: StateContext<AuthStateModel>,
    action: UpdateUser
  ): void {
    this.fireauth.currentUser.then((user) => {
      user.updateProfile(AuthState.userProps(action.user));
      ctx.dispatch(new SetUser(action.user));
    });
  }
}
