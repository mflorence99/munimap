import { environment } from '../environment';

import 'firebase/analytics';

import * as Sentry from '@sentry/angular';

import { EMPTY } from 'rxjs';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import firebase from 'firebase/app';

export function initializeAppProvider(
  initializer: InitializerService
): Function {
  return (): Observable<any> => initializer.initialize();
}

@Injectable({ providedIn: 'root' })
export class InitializerService {
  initialize(): Observable<any> {
    if (environment.production)
      console.log('%cPRODUCTION', 'color: darkorange');
    else console.log('%cLOCALHOST', 'color: dodgerblue');
    console.table(environment.package);
    console.table(environment.build);
    console.table(environment.ua);
    console.table(environment.firebase);

    // 👉 initialize Sentry.io
    if (environment.production) {
      Sentry.init({
        debug: true,
        dsn: 'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
        release: `MuniMap v${environment.package.version}`
      });
    }

    // 👉 initialize analytics
    //    just tracking access to the app for now
    if (environment.production) firebase.analytics().logEvent('login');

    // 👉 initialize firestore
    firebase
      .firestore()
      .enablePersistence()
      .catch((error) => console.error(error));

    return EMPTY;
  }
}
