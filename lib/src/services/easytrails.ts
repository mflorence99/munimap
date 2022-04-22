import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { timeout } from 'rxjs/operators';

// ❗ we have to use "fetch" here, rather than Angular's HttpClient
//    because the EasyTrails app uses a CORS-enabled server

// 👀 https://stackoverflow.com/questions/47345282

export interface Track {
  description: string;
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class EasyTrailsService {
  #validationTimeout = 1000 /* 👈 ms */;

  lastUsedURL = localStorage.getItem('easytrails.url') ?? '';

  listTracks(): Observable<Track[]> {
    return from(
      fetch(this.lastUsedURL, {
        method: 'GET',
        mode: 'no-cors'
      })
    ).pipe(
      switchMap((response: Response) => response.text()),
      map((html: string) => {
        console.log(html);
        return [];
      })
    );
  }

  validate(url: string): Observable<any> {
    localStorage.setItem('easytrails.url', url);
    this.lastUsedURL = url;
    return from(
      fetch(url, {
        method: 'GET',
        mode: 'no-cors'
      })
    ).pipe(timeout(this.#validationTimeout));
  }
}
