import { LogRocketPluginModule } from './state/plugins/logrocket';
import { RootPage } from './root';

import { environment } from '../environment';

import * as Sentry from '@sentry/angular';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { connectAuthEmulator } from '@angular/fire/auth';
import { getAuth } from '@angular/fire/auth';
import { initializeApp } from '@angular/fire/app';
import { provideAuth } from '@angular/fire/auth';
import { provideFirebaseApp } from '@angular/fire/app';

@NgModule({
  bootstrap: [RootPage],

  declarations: [RootPage],

  entryComponents: [],

  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    NgxsModule.forRoot([], {
      developmentMode: !environment.production
    }),
    NgxsStoragePluginModule.forRoot({
      key: []
    }),
    LogRocketPluginModule.forRoot(),
    ReactiveFormsModule,
    RouterModule.forRoot([]),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      if (!environment.production) {
        connectAuthEmulator(auth, 'http://localhost:9099');
      }
      return auth;
    })
  ],

  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        logErrors: true,
        showDialog: true
      })
    }
  ]
})
export class RootModule {}
