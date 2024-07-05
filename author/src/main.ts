import { RootModule } from "./app/module";

import * as Sentry from "@sentry/angular-ivy";

import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { environment } from "@lib/environment";

if (environment.production) enableProdMode();

platformBrowserDynamic()
  .bootstrapModule(RootModule)
  .catch((error) => {
    console.error(error);
    Sentry.captureException(error);
  });
