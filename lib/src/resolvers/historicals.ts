import { HistoricalMapIndex } from "../common";
import { HistoricalsService } from "../services/historicals";

import { Injectable } from "@angular/core";
import { Resolve } from "@angular/router";
import { Observable } from "rxjs";

import { inject } from "@angular/core";

@Injectable({ providedIn: "root" })
export class HistoricalsResolver implements Resolve<HistoricalMapIndex> {
  #historicals = inject(HistoricalsService);

  resolve(): Observable<HistoricalMapIndex> {
    return this.#historicals.loadHistoricals();
  }
}
