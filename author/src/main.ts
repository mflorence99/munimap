import { RootModule } from './app/module';

import * as Sentry from '@sentry/angular-ivy';

import { enableProdMode } from '@angular/core';
import { environment } from '@lib/environment';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

if (environment.production) enableProdMode();

platformBrowserDynamic()
  .bootstrapModule(RootModule)
  .catch((error) => {
    console.error(error);
    Sentry.captureException(error);
  });
