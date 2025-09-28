import { VersionDialogComponent } from '../components/version-dialog';

import { environment } from '../environment';

import * as Sentry from '@sentry/angular';

import { ApplicationRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { SwPush } from '@angular/service-worker';
import { SwUpdate } from '@angular/service-worker';
import { UnrecoverableStateEvent } from '@angular/service-worker';

import { catchError } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { first } from 'rxjs/operators';
import { inject } from '@angular/core';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { timer } from 'rxjs';

interface Build {
  date: string;
  id: number;
}

@Injectable({ providedIn: 'root' })
export class VersionService {
  #appRef = inject(ApplicationRef);
  #checkVersionLegacy$ = new Subject<void>();
  #dialog = inject(MatDialog);
  #http = inject(HttpClient);
  #serviceWorkerCanNotify: boolean;
  #serviceWorkerEnabled: boolean;
  #swPush = inject(SwPush);
  #swUpdate = inject(SwUpdate);

  constructor() {
    // 👀 https://stackoverflow.com/questions/51435349
    // 👉 service worker update notification fails on iOS
    this.#serviceWorkerCanNotify =
      this.#swUpdate.isEnabled && this.#swPush.isEnabled;
    this.#serviceWorkerEnabled = this.#swUpdate.isEnabled;
    this.#pollVersion();
  }

  hardReset(): void {
    navigator.serviceWorker
      ?.getRegistrations()
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
        console.log('%cHard reset', 'color: plum');
        location.reload();
      });
  }

  #checkUnrecoverableServiceWorker(): void {
    this.#swUpdate.unrecoverable.subscribe((event: UnrecoverableStateEvent) => {
      console.error('🔥 Unrecoverable PWA error', event.reason);
      Sentry.captureException(event);
      this.hardReset();
    });
  }

  #checkVersionServiceWorker(): void {
    this.#swUpdate.versionUpdates
      .pipe(filter((event) => event.type === 'VERSION_DETECTED'))
      .subscribe((event) => {
        console.log(
          '%c...new PWA version detected',
          'color: wheat',
          event.version.hash
        );
        if (environment.version.autoReload)
          this.#swUpdate.activateUpdate().then(() => this.hardReset());
        else this.#newVersionDetected();
      });
  }

  #newVersionDetected(): void {
    this.#dialog
      .open(VersionDialogComponent)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // 👇 use says ACTIVATE
          if (this.#serviceWorkerCanNotify)
            this.#swUpdate.activateUpdate().then(() => this.hardReset());
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
    const periodically$ = timer(
      environment.version.checkVersionAfter,
      environment.version.checkVersionInterval
    );
    periodically$
      .pipe(
        takeUntil(this.#checkVersionLegacy$),
        mergeMap(() =>
          this.#http
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
    this.#appRef.isStable
      .pipe(
        // 🔥 looks like firebase is preventing the app from
        //    becoming stable but not totally sure
        first(/* (isStable) => isStable */),
        tap(() => console.log('%cPWA is stable', 'color: thistle')),
        switchMap(() =>
          timer(
            environment.version.checkVersionAfter,
            environment.version.checkVersionInterval
          )
        )
      )
      .subscribe((): any => {
        console.log('%cPolling for new PWA version...', 'color: moccasin');
        this.#swUpdate.checkForUpdate().then();
      });
  }
}
