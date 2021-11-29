import { VersionDialogComponent } from '../components/version-dialog';

import { environment } from '../environment';

import { ApplicationRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { SwPush } from '@angular/service-worker';
import { SwUpdate } from '@angular/service-worker';
import { UnrecoverableStateEvent } from '@angular/service-worker';
import { VersionDetectedEvent } from '@angular/service-worker';

import { catchError } from 'rxjs/operators';
import { concat } from 'rxjs';
import { filter } from 'rxjs/operators';
import { first } from 'rxjs/operators';
import { interval } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { timer } from 'rxjs';

interface Build {
  date: string;
  id: number;
}

@Injectable({ providedIn: 'root' })
export class VersionService {
  #checkVersionLegacy$ = new Subject<void>();

  // 👀 https://stackoverflow.com/questions/51435349
  // 👉 service worker update notification fails on iOS
  #serviceWorkerCanNotify = this.swUpdate.isEnabled && this.swPush.isEnabled;
  #serviceWorkerEnabled = this.swUpdate.isEnabled;

  constructor(
    private appRef: ApplicationRef,
    private dialog: MatDialog,
    private http: HttpClient,
    private swPush: SwPush,
    private swUpdate: SwUpdate
  ) {
    this.#pollVersion();
  }

  #checkUnrecoverableServiceWorker(): void {
    this.swUpdate.unrecoverable.subscribe((event: UnrecoverableStateEvent) => {
      console.error('🔥 Unrecoverable PWA error', event.reason);
      this.hardReset();
    });
  }

  #checkVersionServiceWorker(): void {
    this.swUpdate.versionUpdates
      .pipe(filter((event) => event.type === 'VERSION_DETECTED'))
      .subscribe((event) => {
        console.log(
          '%c...new PWA version detected',
          'color: wheat',
          (event as VersionDetectedEvent).version.hash
        );
        if (environment.version.autoReload)
          this.swUpdate.activateUpdate().then(() => location.reload());
        else this.#newVersionDetected();
      });
  }

  #newVersionDetected(): void {
    this.dialog
      .open(VersionDialogComponent)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // 👇 use says ACTIVATE
          if (this.#serviceWorkerCanNotify)
            this.swUpdate.activateUpdate().then(() => location.reload());
          else this.hardReset();
        } else if (!this.#serviceWorkerEnabled) {
          // 👇 once the user says LATER we won't check again in legacy
          //    mode -- but we must when using service workers, because
          //    a bookmarked PWA may never be restarted
          this.#checkVersionLegacy$.next();
          this.#checkVersionLegacy$.complete();
          console.log(
            '%cUser declines further legacy version checks',
            'color: orchid'
          );
        }
      });
  }

  #pollVersion(): void {
    if (this.#serviceWorkerCanNotify) {
      this.#checkUnrecoverableServiceWorker();
      this.#checkVersionServiceWorker();
      this.#pollVersionServiceWorker();
    } else this.#pollVersionLegacy();
  }

  #pollVersionLegacy(): void {
    const params = environment.version;
    timer(params.checkVersionLegacyAfter, params.checkVersionInterval)
      .pipe(
        takeUntil(this.#checkVersionLegacy$),
        mergeMap(() =>
          this.http
            .get<Build>(`assets/build.json`, {
              params: {
                x: Math.random()
              }
            })
            .pipe(catchError(() => of(environment.build)))
        )
      )
      .subscribe((build: Build) => {
        console.log('%cPolling for new legacy version...', 'color: khaki');
        if (build.id !== environment.build.id) {
          console.log(
            '%c...new legacy version detected',
            'color: tan',
            build.id,
            build.date
          );
          if (environment.version.autoReload) this.hardReset();
          else this.#newVersionDetected();
        }
      });
  }

  #pollVersionServiceWorker(): void {
    const appIsStable$ = this.appRef.isStable.pipe(
      first((isStable) => isStable)
    );
    const periodically$ = interval(environment.version.checkVersionInterval);
    concat(appIsStable$, periodically$).subscribe((): any => {
      console.log('%cPolling for new PWA version...', 'color: moccasin');
      this.swUpdate.checkForUpdate().then();
    });
  }

  hardReset(): void {
    // 👉 we won't launch unless service workers are supported
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        console.log('%cUpdating all registrations...', 'color: violet');
        return Promise.all(
          registrations.map((registration) => {
            console.log(`... ${registration.scope}`);
            return registration.update().then(() => registration.unregister());
          })
        );
      })
      .then((_) => caches.keys())
      .then((keys) => {
        console.log('%cDeleting all caches...', 'color: orchid');
        return Promise.all(
          keys.map((key) => {
            console.log(`... ${key}`);
            return caches.delete(key);
          })
        );
      })
      .finally(() => {
        console.log('%cReloading app', 'color: plum');
        location.reload();
      });
  }
}
