import { HttpEvent } from '@angular/common/http';
import { HttpHandler } from '@angular/common/http';
import { HttpInterceptor } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { of } from 'rxjs';
import { share } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

// 👇 https://blog.logrocket.com/caching-with-httpinterceptor-in-angular/

@Injectable()
export class HttpCache implements HttpInterceptor {
  private cache: Map<string, HttpResponse<any>> = new Map();

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.method !== 'GET') return next.handle(req);
    if (req.headers.get('cache') !== 'true') this.cache.delete(req.url);
    const cachedResponse: HttpResponse<any> = this.cache.get(req.url);
    if (cachedResponse) return of(cachedResponse.clone());
    else {
      return next.handle(req).pipe(
        tap((stateEvent) => {
          if (stateEvent instanceof HttpResponse) {
            this.cache.set(req.url, stateEvent.clone());
          }
        }),
        share()
      );
    }
  }
}
