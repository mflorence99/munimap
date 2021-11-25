import { GeoJSONService } from './geojson';
import { Params } from './params';

import { environment } from '../environment';

import 'firebase/analytics';

import * as Sentry from '@sentry/angular';

import { Injectable } from '@angular/core';
import { Integrations } from '@sentry/tracing';
import { Observable } from 'rxjs';

import { forkJoin } from 'rxjs';

import firebase from 'firebase/app';

export function initializeAppProvider(
  initializer: InitializerService
): Function {
  return (): Observable<any> => initializer.initialize();
}

@Injectable({ providedIn: 'root' })
export class InitializerService {
  constructor(private geoJSON: GeoJSONService, private params: Params) {}

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
        dsn: 'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
        integrations: [
          new Integrations.BrowserTracing({
            // TODO 🔥 don't know where it will go yet!
            tracingOrigins: ['https://XXXXX'],
            routingInstrumentation: Sentry.routingInstrumentation
          })
        ],
        tracesSampleRate: 1.0
      });
    }

    // 👉 initialize analytics
    //    just tracking access to the app for now
    firebase.analytics().logEvent('login');

    // 👉 initialize firestore
    firebase
      .firestore()
      .enablePersistence()
      .catch((error) => console.error(error));

    // 👉 preload index of geojson data
    const preload = [this.geoJSON.loadIndex()];
    return forkJoin(preload);
  }
}
