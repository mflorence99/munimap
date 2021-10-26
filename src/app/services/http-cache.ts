import { HttpEvent } from '@angular/common/http';
import { HttpHandler } from '@angular/common/http';
import { HttpInterceptor } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

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
    const cache = this.#cache[req.headers.get('cache')];
    if (!cache) return next.handle(req);

    // 👉 lookup the cached response
    const cachedResponse: HttpResponse<any> = cache[req.url];
    if (cachedResponse) return of(cachedResponse.clone());

    // 👉 not cached? process request and cache response
    return next.handle(req).pipe(
      tap((stateEvent) => {
        if (stateEvent instanceof HttpResponse) {
          cache[req.url] = stateEvent.clone();
        }
      }),
      share()
    );
  }
}
