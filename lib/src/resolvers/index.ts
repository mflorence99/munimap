import { Index } from "../common";
import { GeoJSONService } from "../services/geojson";

import { Injectable } from "@angular/core";
import { Resolve } from "@angular/router";
import { Observable } from "rxjs";

import { inject } from "@angular/core";

@Injectable({ providedIn: "root" })
export class IndexResolver implements Resolve<Index> {
  #geoJSON = inject(GeoJSONService);

  resolve(): Observable<Index> {
    return this.#geoJSON.loadIndex();
  }
}
