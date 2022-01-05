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

import chalk from 'chalk';
import fetch from 'node-fetch';
import hash from 'object-hash';

// 👇 proxy server options

export interface ProxyServerOpts {
  maxAge?: number;
  root?: string;
}

export const PROXY_SERVER_OPTS = new InjectionToken<ProxyServerOpts>(
  'PROXY_SERVER_OPTS'
);

export const PROXY_SERVER_DEFAULT_OPTS: ProxyServerOpts = {
  maxAge: 600,
  root: '/tmp'
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
          this.#opts.root,
          fname.substring(0, 2),
          fname.substring(2, 4)
        );
        const fpath = path.join(fdir, `${fname}.proxy`);

        // 👉 see if we've cached the result
        let stat;
        try {
          stat = fs.statSync(fpath);
        } catch (error) {}
        const maxAge = this.#opts.maxAge;
        const isCached = stat?.mtimeMs > Date.now() - maxAge * 1000;

        // 👇 because we set maxAge tobthe exact time that we discard the
        //    disk copy of the proxied data, we never have to bother
        //    with returning a 304 status

        // 👉 read from file system if cached
        if (isCached) {
          return fromReadableStream(fs.createReadStream(fpath)).pipe(
            tap((buffer: Buffer) => {
              response.body = buffer;
              response.headers['Cache-Control'] = `max-age=${maxAge}`;
              response.statusCode = 200;
            }),
            tap(() => {
              console.log(
                chalk.yellow(request.method),
                request.path,
                chalk.green(response.statusCode),
                stat?.mtime,
                chalk.blue('CACHED')
              );
            }),
            mapTo(message)
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
                fs.mkdirSync(fdir, { recursive: true });
                fs.writeFile(fpath, buffer, () => {});
              }
            }),
            tap(() => {
              console.log(
                chalk.yellow(request.method),
                request.path,
                chalk.green(response.statusCode),
                chalk.red('FETCHED')
              );
            }),
            mapTo(message)
          );
        }
      })
    );
  }
}
