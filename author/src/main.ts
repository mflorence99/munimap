import { RootModule } from './app/module';

import { environment } from './environment';

import * as Sentry from '@sentry/angular';

import { Integrations } from '@sentry/tracing';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

console.table(environment.package);
console.table(environment.build);
console.table(environment.ua);
console.table(environment.firebase);

Sentry.init({
  dsn: 'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
  integrations: [
    new Integrations.BrowserTracing({
      // TODO 🔥 don't know where it will go yet!
      tracingOrigins: ['localhost', 'https://XXXXX'],
      routingInstrumentation: Sentry.routingInstrumentation
    })
  ],
  tracesSampleRate: 1.0
});

if (environment.production) enableProdMode();

platformBrowserDynamic()
  .bootstrapModule(RootModule)
  .catch((error) => console.error(error));
