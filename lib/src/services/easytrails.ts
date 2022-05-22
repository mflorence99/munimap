import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { timeout } from 'rxjs/operators';

// 🔥 this doesn't work, because of CORS and mixed-content issues

export interface Track {
  description: string;
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class EasyTrailsService {
  #validationTimeout = 1000 /* 👈 ms */;

  lastUsedURL = localStorage.getItem('easytrails.url') ?? '';

  // 👁️ https://www.educative.io/edpresso/how-to-dynamically-load-a-js-file-in-javascript

  #fetch(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = url;
      // 👇 on successful load
      script.addEventListener('load', () => {
        resolve(script.innerHTML);
        document.head.removeChild(script);
      });
      // 👇 on script failure
      script.addEventListener('error', () => {
        reject();
        document.head.removeChild(script);
      });
      // 👇 load "script"
      try {
        document.head.appendChild(script);
      } catch (error) {
        reject();
        document.head.removeChild(script);
      }
    });
  }

  listTracks(): Observable<Track[]> {
    return from(this.#fetch(this.lastUsedURL)).pipe(
      map((html: string) => {
        console.log(html);
        return [];
      })
    );
  }

  validate(url: string): Observable<any> {
    localStorage.setItem('easytrails.url', url);
    this.lastUsedURL = url;
    return from(this.#fetch(url)).pipe(timeout(this.#validationTimeout));
  }
}
