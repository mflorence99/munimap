import { Location } from "@angular/common";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { User as FirebaseUser } from "@angular/fire/auth";
import { Firestore } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { Action } from "@ngxs/store";
import { NgxsOnInit } from "@ngxs/store";
import { Selector } from "@ngxs/store";
import { State } from "@ngxs/store";
import { StateContext } from "@ngxs/store";
import { Store } from "@ngxs/store";

import { inject } from "@angular/core";
import { signOut } from "@angular/fire/auth";
import { updateProfile } from "@angular/fire/auth";
import { user } from "@angular/fire/auth";
import { doc } from "@angular/fire/firestore";
import { getDoc } from "@angular/fire/firestore";
import { setDoc } from "@angular/fire/firestore";

const ACTION_SCOPE = "Auth";

export namespace AuthActions {
  export class Logout {
    static readonly type = `[${ACTION_SCOPE}] Logout`;
  }

  export class SetProfile {
    static readonly type = `[${ACTION_SCOPE}] SetProfile`;
    constructor(public profile: Profile) {}
  }

  export class SetUser {
    static readonly type = `[${ACTION_SCOPE}] SetUser`;
    constructor(public user: FirebaseUser | User | null) {}
  }

  export class UpdateProfile {
    static readonly type = `[${ACTION_SCOPE}] UpdateProfile`;
    constructor(public profile: Profile) {}
  }

  export class UpdateUser {
    static readonly type = `[${ACTION_SCOPE}] UpdateUser`;
    constructor(public user: User) {}
  }
}

export interface Profile {
  email: string;
  workgroup: string;
}

export interface User {
  displayName: string;
  email: string;
  password?: string;
  photoURL?: string;
  uid: string;
}

export interface AuthStateModel {
  profile: Profile;
  user: User;
}

export function profileProps(obj: any): any {
  return {
    email: obj.email,
    workgroup: obj.workgroup
  };
}

export function userProps(obj: any): any {
  return {
    displayName: obj.displayName,
    email: obj.email,
    photoURL: obj.photoURL ?? "",
    uid: obj.uid
  };
}

export function workgroup(profile: Profile): string[] {
  let workgroup = [profile.email];
  if (profile.workgroup)
    workgroup = workgroup
      .concat(profile.workgroup.split(/[\n ;]+/g))
      .filter((email) => !!email);
  return workgroup;
}

@State<AuthStateModel>({
  name: "auth",
  defaults: {
    profile: null,
    user: null
  }
})
@Injectable()
export class AuthState implements NgxsOnInit {
  #fireauth = inject(Auth);
  #firestore = inject(Firestore);
  #location = inject(Location);
  #router = inject(Router);
  #store = inject(Store);

  @Action(AuthActions.Logout) logout(): void {
    // 👉 we reload the app to cancel all the subscriptions
    //    that rely on a logged-in user
    signOut(this.#fireauth).then(() => location.reload());
  }

  @Selector() static profile(state: AuthStateModel): Profile {
    return state.profile;
  }

  @Action(AuthActions.SetProfile) setProfile(
    ctx: StateContext<AuthStateModel>,
    action: AuthActions.SetProfile
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      profile: profileProps(action.profile)
    });
  }

  @Action(AuthActions.SetUser) setUser(
    ctx: StateContext<AuthStateModel>,
    action: AuthActions.SetUser
  ): void {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      user: action.user ? userProps(action.user) : null
    });
  }

  @Action(AuthActions.UpdateProfile) updateProfile(
    ctx: StateContext<AuthStateModel>,
    action: AuthActions.UpdateProfile
  ): void {
    const user = ctx.getState().user;
    console.log(
      `%cFirestore set: profiles ${user.email} ${JSON.stringify(
        action.profile
      )}`,
      "color: chocolate"
    );
    const docRef = doc(this.#firestore, "profiles", user.email);
    setDoc(docRef, profileProps(action.profile), {
      merge: true
    }).then(() => ctx.dispatch(new AuthActions.SetProfile(action.profile)));
  }

  @Action(AuthActions.UpdateUser) updateUser(
    ctx: StateContext<AuthStateModel>,
    action: AuthActions.UpdateUser
  ): void {
    updateProfile(this.#fireauth.currentUser, userProps(action.user)).then(() =>
      ctx.dispatch(new AuthActions.SetUser(action.user))
    );
  }

  @Selector() static user(state: AuthStateModel): User {
    return state.user;
  }

  currentProfile(): Profile {
    return this.#store.selectSnapshot<Profile>(AuthState.profile);
  }

  currentUser(): User {
    return this.#store.selectSnapshot<User>(AuthState.user);
  }

  ngxsOnInit(ctx: StateContext<AuthStateModel>): void {
    const deepLink = this.#location.path();
    const lastRoute = this.#store.snapshot().router?.state.url;
    // 👇 don't try to use ?? here, because deepLink and lastRoute
    //    are blank when empty, not null or undefined
    const forwardTo = deepLink || lastRoute || "/create";
    // 👉 the user will be NULL on logout!
    user(this.#fireauth).subscribe((user) => {
      ctx.dispatch(new AuthActions.SetUser(user));
      if (user) {
        console.log(
          `%cFirestore get: profiles ${user.email}`,
          "color: goldenrod"
        );
        // 👉 set the profile corresponding to the User
        //    or an empty one if none found
        const docRef = doc(this.#firestore, "profiles", user.email);
        getDoc(docRef).then((doc) => {
          if (doc.exists())
            ctx.dispatch(new AuthActions.SetProfile(doc.data() as Profile));
          else
            ctx.dispatch(
              new AuthActions.UpdateProfile({
                email: user.email,
                workgroup: ""
              })
            );
        });
        // 👉 no point in going to login if we're logged in!
        this.#router.navigateByUrl(
          forwardTo === "/login" ? "/create" : forwardTo
        );
      }
    });
  }
}
