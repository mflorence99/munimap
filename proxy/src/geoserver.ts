import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Exception } from 'serverx-ts';
import { Handler } from 'serverx-ts';
import { Inject } from 'injection-js';
import { Injectable } from 'injection-js';
import { InjectionToken } from 'injection-js';
import { Message } from 'serverx-ts';
import { Observable } from 'rxjs';
import { Optional } from 'injection-js';

import { catchError } from 'rxjs/operators';
import { from } from 'rxjs';
import { fromReadableStream } from 'serverx-ts';
import { mapTo } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

import bbox from '@turf/bbox';
import copy from 'fast-copy';
import md5File from 'md5-file';

export interface GeoServerOpts {
  maxAge?: number;
  root?: string;
}

export const GEO_SERVER_OPTS = new InjectionToken<GeoServerOpts>(
  'GEO_SERVER_OPTS'
);

export const GEO_SERVER_DEFAULT_OPTS: GeoServerOpts = {
  maxAge: 600,
  root: os.homedir()
};

@Injectable()
export class GeoServer extends Handler {
  #opts: GeoServerOpts;

  // 🔥 in memory cache of ALL geojon data by path that NEVER
  //    gets evicted  -- it works FOR NOW because Washington is
  //    the only real implementation with 5mb of data
  #stash: Record<string, GeoJSON.FeatureCollection> = {};

  constructor(@Optional() @Inject(GEO_SERVER_OPTS) opts: GeoServerOpts) {
    super();
    this.#opts = opts
      ? { ...GEO_SERVER_DEFAULT_OPTS, ...opts }
      : GEO_SERVER_DEFAULT_OPTS;
  }

  #filter(
    geojson: GeoJSON.FeatureCollection,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): Buffer {
    if (minX && minY && maxX && maxY) {
      geojson = copy(geojson);
      // const qbbox = bboxPolygon([minX, minY, maxX, maxY]);
      geojson.features = geojson.features.filter((feature) => {
        // 👉 some features don't have a bbox, but we prefer
        //    it if present as it is faster
        const [left, bottom, right, top] = feature.bbox ?? bbox(feature);
        // 👉 https://gamedev.stackexchange.com/questions/586
        return !(minX > right || maxX < left || maxY < bottom || minY > top);
      });
    }
    return Buffer.from(JSON.stringify(geojson));
  }

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      mergeMap((message: Message): Observable<Message> => {
        const { request, response } = message;

        // 👉 extract file path
        const fpath = path.join(this.#opts.root, request.path);

        // 👉 Etag is the file hash
        const etag = request.headers['If-None-Match'];

        // 👉 extract bbox parameters
        const minX = Number(request.query.get('minX') ?? 0);
        const minY = Number(request.query.get('minY') ?? 0);
        const maxX = Number(request.query.get('maxX') ?? 0);
        const maxY = Number(request.query.get('maxY') ?? 0);

        return of(message).pipe(
          // 👉 exception thrown if not found
          mergeMap((): Observable<string> => from(md5File(fpath))),

          // 👉 set the response headers
          tap((hash: string) => {
            response.headers['Cache-Control'] = `max-age=${this.#opts.maxAge}`;
            response.headers['Etag'] = hash;
          }),

          // 👉 flip to cached/not cached pipes
          mergeMap((hash: string): Observable<Message> => {
            const isCached = etag === hash;
            const isStashed = !!this.#stash[fpath];

            // 👉 cached pipe
            const cached$ = of(hash).pipe(
              tap(() => (response.statusCode = 304)),
              mapTo(message)
            );

            // 👉 stashed pipe
            const stashed$ = of(hash).pipe(
              tap(() => {
                const geojson = this.#stash[fpath];
                response.body = this.#filter(geojson, minX, minY, maxX, maxY);
                response.statusCode = 200;
              }),
              mapTo(message)
            );

            // 👉 "must read" pipe
            const mustRead$ = of(hash).pipe(
              mergeMap(
                (): Observable<Buffer> =>
                  fromReadableStream(fs.createReadStream(fpath))
              ),
              tap((buffer: Buffer) => {
                const geojson = JSON.parse(buffer.toString());
                this.#stash[fpath] = geojson;
                response.body = this.#filter(geojson, minX, minY, maxX, maxY);
                response.statusCode = 200;
              }),
              mapTo(message)
            );

            return isStashed ? stashed$ : isCached ? cached$ : mustRead$;
          }),
          catchError((e) => {
            console.error(e);
            return throwError(() => new Exception({ statusCode: 404 }));
          })
        );
      })
    );
  }
}
