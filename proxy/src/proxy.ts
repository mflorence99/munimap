import * as fs from 'fs';
import * as path from 'path';

import { Handler } from 'serverx-ts';
import { Inject } from 'injection-js';
import { Injectable } from 'injection-js';
import { InjectionToken } from 'injection-js';
import { Message } from 'serverx-ts';
import { Observable } from 'rxjs';
import { Optional } from 'injection-js';

import { from } from 'rxjs';
import { fromReadableStream } from 'serverx-ts';
import { mapTo } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs';

import fetch from 'node-fetch';
import hash from 'object-hash';
import md5File from 'md5-file';

// 👇 proxy server options

export interface ProxyServerOpts {
  cache?: string;
  maxAge?: number;
}

export const PROXY_SERVER_OPTS = new InjectionToken<ProxyServerOpts>(
  'PROXY_SERVER_OPTS'
);

export const PROXY_SERVER_DEFAULT_OPTS: ProxyServerOpts = {
  cache: '/tmp',
  maxAge: 30 * 24 * 60 * 60 /* 👈 30 days */
};

// 👇 a trivial proxy server so that we can use ArcGIS etc
//    in production -- ie w/o the Webpack proxy

@Injectable()
export class ProxyServer extends Handler {
  #opts: ProxyServerOpts;

  constructor(@Optional() @Inject(PROXY_SERVER_OPTS) opts: ProxyServerOpts) {
    super();
    this.#opts = opts
      ? { ...PROXY_SERVER_DEFAULT_OPTS, ...opts }
      : PROXY_SERVER_DEFAULT_OPTS;
  }

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      mergeMap((message: Message): Observable<Message> => {
        const { request, response } = message;

        // 👉 Etag is the file hash
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

        // 👉 use the first 4 characters of the hash as a directory index
        const fname = hash.MD5(url);
        const fdir = path.join(
          this.#opts.cache,
          fname.substring(0, 2),
          fname.substring(2, 4)
        );
        const fpath = path.join(fdir, `${fname}.proxy`);

        // 👉 see if we've stashed result
        let stat;
        try {
          stat = fs.statSync(fpath);
        } catch (error) {}
        const maxAge = this.#opts.maxAge;
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
              return from(
                // 👇 DO proxy the referer (yes, that misspelling is correct!)
                //    and the user-agent to satisy API domain rstrictions
                fetch(url, {
                  headers: {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    'Referer': request.headers['Referer'] as string,
                    'User-Agent': request.headers['User-Agent'] as string
                    /* eslint-enable @typescript-eslint/naming-convention */
                  }
                })
              ).pipe(
                tap((resp) => {
                  // 👇 DON'T proxy content-encoding, because fetch will
                  //    have already decoded the response and we can't
                  //    decode it again
                  for (const key of resp.headers.keys()) {
                    if (!['content-encoding'].includes(key.toLowerCase()))
                      response.headers[key] = resp.headers.get(key);
                  }
                }),
                tap((resp) => (response.statusCode = resp.status)),
                mergeMap((resp) => from(resp.buffer())),
                tap((buffer) => (response.body = buffer)),
                tap((buffer) => {
                  if (response.statusCode === 200) {
                    fs.mkdir(fdir, { recursive: true }, (err, path) => {
                      if (path) fs.writeFile(fpath, buffer, () => {});
                    });
                  }
                })
              );
            }
          }),
          mapTo(message)
        );
      })
    );
  }
}
