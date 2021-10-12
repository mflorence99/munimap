import { AuthState } from './state/auth';
import { BoundaryResolver } from './resolvers/boundary';
import { DummyPage } from './pages/dummy';
import { HttpCache } from './services/http-cache';
import { IndexResolver } from './resolvers/index';
import { InitializerService } from './services/initializer';
import { LoginPage } from './pages/login';
import { MapPage } from './pages/map';
import { MapsPage } from './pages/maps';
import { OLMapComponent } from './components/ol-map';
import { RootPage } from './root';
import { UserProfileComponent } from './components/user-profile';

import { environment } from '../environment';
import { initializeAppProvider } from './services/initializer';

import * as Sentry from '@sentry/angular';

import { AngularFireAuthGuard } from '@angular/fire/auth-guard';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireModule } from '@angular/fire';
import { APP_INITIALIZER } from '@angular/core';
import { AuthPipe } from '@angular/fire/auth-guard';
import { AvatarModule } from 'ngx-avatar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ErrorHandler } from '@angular/core';
import { FirebaseUIModule } from 'firebaseui-angular';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgModule } from '@angular/core';
import { NgObjectPipesModule } from 'ngx-pipes';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { OverlayModule } from '@angular/cdk/overlay';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RouterState } from '@ngxs/router-plugin';
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';

import { redirectLoggedInTo } from '@angular/fire/auth-guard';
import { redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const COMPONENTS = [OLMapComponent, UserProfileComponent];

const PAGES = [LoginPage, MapPage, MapsPage, DummyPage, RootPage];

const redirectUnauthorizedToLogin = (): AuthPipe =>
  redirectUnauthorizedTo(['login']);
const redirectLoggedInToMaps = (): AuthPipe => redirectLoggedInTo(['maps']);

const ROUTES = [
  { path: 'dummy', component: DummyPage, data: { state: '404' } },
  {
    path: 'login',
    component: LoginPage,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectLoggedInToMaps, state: 'login' }
  },
  {
    path: '',
    resolve: {
      index: IndexResolver
    },
    children: [
      {
        path: 'map',
        component: MapPage,
        canActivate: [AngularFireAuthGuard],
        data: { authGuardPipe: redirectUnauthorizedToLogin, state: 'map' },
        resolve: {
          boundary: BoundaryResolver
        }
      },
      {
        path: 'maps',
        component: MapsPage,
        canActivate: [AngularFireAuthGuard],
        data: { authGuardPipe: redirectUnauthorizedToLogin, state: 'maps' }
      },
      { path: '', redirectTo: '/login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login', pathMatch: 'full' }
];

const STATES = [AuthState];
const STATES_SAVED = [RouterState];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...PAGES],

  entryComponents: [],

  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AvatarModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FirebaseUIModule.forRoot(environment.auth),
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatToolbarModule,
    NgObjectPipesModule,
    NgxsModule.forRoot(STATES, {
      developmentMode: !environment.production
    }),
    NgxsLoggerPluginModule.forRoot({ collapsed: false }),
    NgxsReduxDevtoolsPluginModule.forRoot({
      disabled: environment.production
    }),
    NgxsRouterPluginModule.forRoot(),
    NgxsStoragePluginModule.forRoot({
      beforeSerialize: (obj, key) => {
        // 👉 we ONLY want to save the URL
        //    problem: we staore large amounts of data in "data"
        if (key === 'router') obj = { state: { url: obj.state.url } };
        return obj;
      },
      key: STATES_SAVED
    }),
    OverlayModule,
    ReactiveFormsModule,
    RouterModule.forRoot(ROUTES)
  ],

  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppProvider,
      deps: [InitializerService],
      multi: true
    },
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        logErrors: true,
        showDialog: true
      })
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCache,
      multi: true
    },
    {
      provide: USE_AUTH_EMULATOR,
      useValue: !environment.production ? ['localhost', 9099] : undefined
    }
  ]
})
export class RootModule {}
