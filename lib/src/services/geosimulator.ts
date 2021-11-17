import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subscriber } from 'rxjs';

import { finalize } from 'rxjs/operators';
import { point } from '@turf/helpers';
import { shareReplay } from 'rxjs/operators';

import bearing from '@turf/bearing';

const maxIntervalBetweenPositions = 1000;

// 👉 perimter of lot 9-7 in Washington
const simulated = [
  [-72.02787756834498, 43.20854918307005],
  [-72.02822244518005, 43.20855251933214],
  [-72.02842806907017, 43.2085385961035],
  [-72.02872460132497, 43.208550932059005],
  [-72.03114584906771, 43.20405693787193],
  [-72.031040004251, 43.20397313825758],
  [-72.03056359890702, 43.20351198890007],
  [-72.0302820962669, 43.203191491899744],
  [-72.0301540486656, 43.20284836430108],
  [-72.03019087736986, 43.20248033708316],
  [-72.02794717765974, 43.201885851736485],
  [-72.02785742691493, 43.2020542606193],
  [-72.02842394066471, 43.202716129279096],
  [-72.02822770317297, 43.203291918995475],
  [-72.02791961913005, 43.20336810610139],
  [-72.02784074083525, 43.20332853527392],
  [-72.02606264736401, 43.20341377142969],
  [-72.02599633632603, 43.20345379845609],
  [-72.02415192159971, 43.203579031936115],
  [-72.02391252042058, 43.204022217122],
  [-72.02787756834498, 43.20854918307005]
];

@Injectable({ providedIn: 'root' })
export class GeosimulatorService extends Observable<GeolocationPosition> {
  constructor() {
    let counter = 0;
    let lastPoint: number[] | null = null;
    let loopID: any = null;

    super((subscriber: Subscriber<GeolocationPosition>) => {
      // coordinates of test path
      loopID = setInterval(() => {
        // every N ms emit a new position
        const currentPoint = simulated[counter];
        const position = {
          coords: {
            latitude: currentPoint[1],
            longitude: currentPoint[0],
            altitude: null,
            accuracy: Math.random() * 10,
            altitudeAccuracy: null,
            heading: lastPoint
              ? bearing(point(lastPoint), point(currentPoint))
              : null,
            speed: null
          },
          timestamp: Date.now()
        };
        // 👇 simulate loss of GPS signal
        if (counter === 0 || (counter >= 10 && counter < 12)) {
          console.error(
            `🔥 Geosimulator simulated loss of GPS signal #${counter}`
          );
          subscriber.error({ code: 2, message: 'unavailable' });
        } else if (counter === 14) {
          subscriber.error({ code: 1, message: 'unauthorized' });
        } else subscriber.next(position);
        // setup for next point
        counter += 1;
        if (counter === simulated.length) counter = 0;
        lastPoint = currentPoint;
      }, maxIntervalBetweenPositions);
    });

    return this.pipe(
      finalize(() => clearInterval(loopID)),
      shareReplay({ bufferSize: 1, refCount: true })
    ) as GeosimulatorService;
  }
}
