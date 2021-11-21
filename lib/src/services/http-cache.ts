import { HttpEvent } from '@angular/common/http';
import { HttpHandler } from '@angular/common/http';
import { HttpInterceptor } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { delay } from 'rxjs/operators';
import { of } from 'rxjs';
import { share } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

// 👇 https://blog.logrocket.com/caching-with-httpinterceptor-in-angular/

@Injectable()
export class HttpCache implements HttpInterceptor {
  #cache = {
    page: {},
    perm: {}
  };

  constructor(private router: Router) {
    this.#handleRouterEvents$();
  }

  #handleRouterEvents$(): void {
    this.router.events.subscribe((event: any) => {
      switch (true) {
        case event instanceof NavigationStart: {
          this.#cache.page = {};
          break;
        }
      }
    });
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // 👉 we can only cache GET
    if (req.method !== 'GET') return next.handle(req);

    // 👉 locate the appropriate cache, permanent or by page
    //    bail if no cache
    const key = req.headers.get('cache');
    const cache = this.#cache[key];
    if (!cache) return next.handle(req);

    // 👉 lookup the cached response
    const cachedResponse: HttpResponse<any> = cache[req.url];
    if (cachedResponse) {
      console.log(`%cFrom ${key} cache:`, 'color: plum', req.url);
      // 👉 preserve the semantics of an HTTP request
      return of(cachedResponse.clone()).pipe(delay(0));
    }

    // 👉 not cached? process request and cache response
    return next.handle(req).pipe(
      tap((stateEvent) => {
        if (stateEvent instanceof HttpResponse) {
          cache[req.url] = stateEvent.clone();
          // console.log('%cCache size:', 'color: darkorange', roughSizeOf(cache));
        }
      }),
      share()
    );
  }
}

// 👇 https://stackoverflow.com/questions/1248302/how-to-get-the-size-of-a-javascript-object
export function roughSizeOf(object: any): number {
  // const objectList = [];
  // const stack = [object];
  // let bytes = 0;
  // while (stack.length) {
  //   const value = stack.pop();
  //   if (typeof value === 'boolean') {
  //     bytes += 4;
  //   } else if (typeof value === 'string') {
  //     bytes += value.length * 2;
  //   } else if (typeof value === 'number') {
  //     bytes += 8;
  //   } else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
  //     objectList.push(value);
  //     for (const i in value) {
  //       stack.push(value[i]);
  //     }
  //   }
  // }
  // 👇 this is a lot faster and probably more accurate
  //    observed sizes: 500k to 10mb
  return JSON.stringify(object).length;
}
