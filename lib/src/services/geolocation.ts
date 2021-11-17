// 👀  https://github.com/ng-web-apis/geolocation/blob/master/projects/geolocation/src/services/geolocation.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subscriber } from 'rxjs';

import { combineLatest } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { point } from '@turf/helpers';
import { shareReplay } from 'rxjs/operators';
import { timer } from 'rxjs';

import bearing from '@turf/bearing';

const maxIntervalBetweenPositions = 100;

@Injectable({ providedIn: 'root' })
export class GeolocationService extends Observable<GeolocationPosition> {
  constructor() {
    let lastPosition: any;
    let watchPositionID: any;

    super((subscriber: Subscriber<GeolocationPosition>) => {
      watchPositionID = navigator.geolocation.watchPosition(
        (position: GeolocationPosition) => {
          const thisPosition = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading:
                !position.coords.heading && lastPosition
                  ? bearing(
                      point([
                        lastPosition.coords.longitude,
                        lastPosition.coords.latitude
                      ]),
                      point([
                        position.coords.longitude,
                        position.coords.latitude
                      ])
                    )
                  : position.coords.heading,
              speed: position.coords.speed
            },
            timestamp: position.timestamp
          };
          lastPosition = thisPosition;
          subscriber.next(thisPosition);
        },
        (error: GeolocationPositionError) => {
          console.error('🔥 Geolocation position error', error);
          subscriber.error(error);
        }
      );
    });

    // 👇 pace locations at a regular interval, as the UI
    //    depends on "motion" to detect position
    return combineLatest({
      position: this,
      tick: timer(0, maxIntervalBetweenPositions)
    }).pipe(
      finalize(() => {
        navigator.geolocation.clearWatch(watchPositionID);
      }),
      map(({ position }) => ({
        coords: position.coords,
        timestamp: Date.now()
      })),
      shareReplay({ bufferSize: 1, refCount: true })
    ) as GeolocationService;
  }
}
