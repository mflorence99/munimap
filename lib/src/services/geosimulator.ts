import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Subscriber } from "rxjs";

import { bearing } from "@turf/bearing";
import { point } from "@turf/helpers";
import { finalize } from "rxjs/operators";
import { shareReplay } from "rxjs/operators";

const maxIntervalBetweenPositions = 500;

// 👉 Faxon Hill Rd
const simulated = [
  [-72.119527, 43.161521],
  [-72.117643, 43.16251],
  [-72.116926, 43.162878],
  [-72.115947, 43.16337],
  [-72.114534, 43.164048],
  [-72.113235, 43.164624],
  [-72.112487, 43.164934],
  [-72.111841, 43.165136],
  [-72.111658, 43.16519],
  [-72.111498, 43.16526],
  [-72.111395, 43.165328],
  [-72.111302, 43.165396],
  [-72.111148, 43.165556],
  [-72.111006, 43.165732],
  [-72.11047, 43.166502],
  [-72.110315, 43.166702],
  [-72.109865, 43.167179],
  [-72.109711, 43.16738],
  [-72.109638, 43.167499],
  [-72.109592, 43.167604],
  [-72.109555, 43.167715],
  [-72.109525, 43.167861],
  [-72.109516, 43.167982],
  [-72.10952, 43.16841],
  [-72.109506, 43.168522],
  [-72.109484, 43.168621],
  [-72.109442, 43.168703],
  [-72.109363, 43.168795],
  [-72.109253, 43.168873],
  [-72.108991, 43.169043],
  [-72.107792, 43.169748],
  [-72.107217, 43.170088],
  [-72.106399, 43.170557],
  [-72.106093, 43.170763],
  [-72.1059, 43.170919],
  [-72.104082, 43.172925],
  [-72.103955, 43.173073],
  [-72.103843, 43.173225],
  [-72.103779, 43.173326],
  [-72.103708, 43.173464],
  [-72.103572, 43.173749],
  [-72.103518, 43.173856],
  [-72.103451, 43.173966],
  [-72.103352, 43.174076],
  [-72.10318, 43.174242],
  [-72.103011, 43.174412],
];

@Injectable({ providedIn: "root" })
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
            speed: null,
          },
          timestamp: Date.now(),
        };
        // 👇 simulate loss of GPS signal
        // if (counter === 0 || (counter >= 10 && counter < 12)) {
        //   console.error(
        //     `🔥 Geosimulator simulated loss of GPS signal #${counter}`
        //   );
        //   subscriber.error({ code: 2, message: 'unavailable' });
        // } else if (counter === 14) {
        //   subscriber.error({ code: 1, message: 'unauthorized' });
        // }
        // 👇 simulate movement
        /* else */ subscriber.next(position);
        // setup for next point
        counter += 1;
        if (counter === simulated.length) counter = 0;
        lastPoint = currentPoint;
      }, maxIntervalBetweenPositions);
    });

    return this.pipe(
      finalize(() => clearInterval(loopID)),
      shareReplay({ bufferSize: 1, refCount: true }),
    ) as GeosimulatorService;
  }
}
