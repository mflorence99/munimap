import * as fs from 'fs';

import { Handler } from 'serverx-ts';
import { Injectable } from 'injection-js';
import { Message } from 'serverx-ts';
import { Observable } from 'rxjs';

import { from } from 'rxjs';
import { fromReadableStream } from 'serverx-ts';
import { mapTo } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs';

import fetch from 'node-fetch';
import hash from 'object-hash';
import md5File from 'md5-file';

// 👇 a trivial proxy server so that we can use ArcGIS etc
//    in prodfuction -- ie w/o the Webpack proxy

@Injectable()
export class ProxyServer extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      mergeMap((message: Message): Observable<Message> => {
        const { request, response } = message;

        // 👉 Etag is the fie hash
        const etag = request.headers['If-None-Match'];

        // 👉 proxied URL is in the query param
        let url = request.query.get('url');

        // 👉 decode any X, Y, Z parameters
        const x = request.query.get('x');
        const y = request.query.get('y');
        const z = request.query.get('z');
        if (x && y && z) {
          url = url.replace(/\{x\}/, x);
          url = url.replace(/\{y\}/, y);
          url = url.replace(/\{z\}/, z);
        }

        // 👉 see if we've stashed result
        //    stash expires after 30 days
        const fpath = `/tmp/${hash.MD5(url)}.proxy`;
        let stat;
        try {
          stat = fs.statSync(fpath);
        } catch (error) {}
        const maxAge = 30 * 24 * 60 * 60;
        const isStashed = stat?.mtimeMs > Date.now() - maxAge * 1000;

        return of(message).pipe(
          mergeMap(() => {
            // 👉 read from file system if cached
            if (isStashed) {
              return from(md5File(fpath)).pipe(
                tap((hash: string) => {
                  response.headers['Cache-Control'] = `max-age=${maxAge}`;
                  response.headers['Etag'] = hash;
                }),
                mergeMap((hash: string) => {
                  const cached = etag === hash;
                  // cached pipe
                  const cached$ = of(hash).pipe(
                    tap(() => (response.statusCode = 304)),
                    mapTo(message)
                  );
                  // not cached pipe
                  const notCached$ = of(hash).pipe(
                    mergeMap(() =>
                      fromReadableStream(fs.createReadStream(fpath))
                    ),
                    tap((buffer: Buffer) => {
                      response.body = buffer;
                      response.statusCode = 200;
                    })
                  );
                  return cached ? cached$ : notCached$;
                })
              );
            }

            // 👉 use FETCH to GET the proxied URL if not cached
            else {
              return from(fetch(url)).pipe(
                tap((resp) => {
                  const headers = resp.headers.raw();
                  ['cache-control', 'last-modified', 'etag'].forEach((key) => {
                    if (headers[key]) response.headers[key] = headers[key];
                  });
                }),
                tap((resp) => (response.statusCode = resp.status)),
                mergeMap((resp) => from(resp.buffer())),
                tap((buffer) => (response.body = buffer)),
                tap((buffer) => fs.writeFileSync(fpath, buffer))
              );
            }
          }),
          mapTo(message)
        );
      })
    );
  }
}
