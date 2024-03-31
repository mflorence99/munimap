import { HistoricalMap } from '../common';
import { HistoricalMapIndex } from '../common';
import { Path } from '../state/view';

import { environment } from '../environment';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HistoricalsService {
  historicals: HistoricalMapIndex;

  #cacheBuster = {
    version: environment.package.version
  };
  #http = inject(HttpClient);

  historicalsFor(path: Path): HistoricalMap[] {
    return this.historicals[path] ?? [];
  }

  // 🔥 HistoricalsResolver makes sure this is called before we start
  loadHistoricals(): Observable<HistoricalMapIndex> {
    return this.#http
      .get<HistoricalMapIndex>(
        `${environment.endpoints.proxy}/historicals.json`,
        {
          params: this.#cacheBuster
        }
      )
      .pipe(tap((historicals) => (this.historicals = historicals)));
  }
}
