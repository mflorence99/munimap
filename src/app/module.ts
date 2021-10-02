import { LogRocketPluginModule } from './state/plugins/logrocket';
import { RootPage } from './root';

import { environment } from '../environment';

import * as Sentry from '@sentry/angular';

import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientJsonpModule } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  bootstrap: [RootPage],

  declarations: [RootPage],

  entryComponents: [],

  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    HttpClientJsonpModule,
    NgxsModule.forRoot([], {
      developmentMode: !environment.production
    }),
    NgxsStoragePluginModule.forRoot({
      key: []
    }),
    LogRocketPluginModule.forRoot(),
    ReactiveFormsModule
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
