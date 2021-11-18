import { DestroyService } from '../services/destroy';
import { GeolocationService } from '../services/geolocation';
import { OLMapComponent } from './ol-map';
import { SetGPS } from '../state/view';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { linear } from 'ol/easing';
import { retryBackoff } from 'backoff-rxjs';
import { takeUntil } from 'rxjs/operators';

import OLOverlay from 'ol/Overlay';

const backoffInitialInterval = 100;
const backoffMaxInterval = 1000;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-overlay-gps',
  templateUrl: './ol-overlay-gps.html',
  styleUrls: ['./ol-overlay-gps.scss']
})
export class OLOverlayGPSComponent implements OnDestroy, OnInit {
  #lastTimestamp = 0;

  olOverlay: OLOverlay;

  @ViewChild('tracker', { static: true }) tracker: ElementRef<HTMLDivElement>;

  constructor(
    private destroy$: DestroyService,
    private geolocation$: GeolocationService,
    private map: OLMapComponent,
    private snackBar: MatSnackBar,
    private store: Store
  ) {
    this.olOverlay = new OLOverlay({
      autoPan: {
        animation: {
          duration: 100,
          easing: linear
        }
      },
      positioning: 'center-center'
    });
    this.map.olMap.addOverlay(this.olOverlay);
  }

  #currentPositionLost(error: GeolocationPositionError): void {
    this.snackBar.open(`🔥 GPS tracking ${error.message}`, null, {
      duration: 5000
    });
  }

  #handleGeolocation$(): void {
    this.geolocation$
      .pipe(
        takeUntil(this.destroy$),
        // 👀 https://indepth.dev/posts/1260/power-of-rxjs-when-using-exponential-backoff
        retryBackoff({
          backoffDelay: (iteration, initialInterval) =>
            Math.pow(1.1, iteration) * initialInterval,
          initialInterval: backoffInitialInterval,
          maxInterval: backoffMaxInterval,
          resetOnSuccess: true,
          shouldRetry: (error: GeolocationPositionError) => {
            // 👇 we need to use addClass b/c OL has yanked
            //    the tracker out of the DOM
            this.tracker.nativeElement.classList.add('disabled');
            // 👇 GeolocationPositionError.PERMISSION_DENIED throws error on iOS
            return error.code !== 1;
          }
        })
      )
      .subscribe({
        error: this.#handleGeolocationError.bind(this),
        next: this.#handleGeolocationPosition.bind(this)
      });
  }

  #handleGeolocationError(error: GeolocationPositionError): void {
    // 👇 because shouldRetry has no maxRetries, we should only get here
    //    on a PERMISSION_DENIED error
    console.error('🔥 Geolocation handleGeolocationError', error);
    this.#currentPositionLost(error);
    this.store.dispatch(new SetGPS(false));
  }

  #handleGeolocationPosition(position: GeolocationPosition): void {
    // 👉 what is interval between last reading?
    const interval = this.#lastTimestamp
      ? position.timestamp - this.#lastTimestamp
      : 0;
    this.#lastTimestamp = position.timestamp;
    const style = document.body.style;
    style.setProperty('--ol-overlay-animate-duration', `${interval}`);
    // 👇 we need to use removeClass b/c OL has yanked
    //    the tracker out of the DOM
    this.tracker.nativeElement.classList.remove('disabled');
    this.olOverlay.setPosition(
      fromLonLat([position.coords.longitude, position.coords.latitude])
    );
  }

  ngOnDestroy(): void {
    this.map.olMap.removeOverlay(this.olOverlay);
  }

  ngOnInit(): void {
    this.olOverlay.setElement(this.tracker.nativeElement);
    this.#handleGeolocation$();
  }
}
