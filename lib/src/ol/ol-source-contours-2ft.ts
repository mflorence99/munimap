import { OLLayerTileComponent } from "./ol-layer-tile";

import { environment } from "../environment";

import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { Observable } from "rxjs";

import { inject } from "@angular/core";
import { input } from "@angular/core";
import { merge } from "rxjs";
import { of } from "rxjs";
import { catchError } from "rxjs/operators";
import { filter } from "rxjs/operators";
import { mergeMap } from "rxjs/operators";
import { toArray } from "rxjs/operators";

import OLImageTile from "ol/ImageTile";
import OLXYZ from "ol/source/XYZ";

const attribution =
  '<a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

// 🔥 we can't determine the HUC boundaries programmatically because
//    we just don't know how -- so we do what GRANITView does
//    and read and composite them all

// 🔥 PROBLEM: HUCs that don't apply for a given XYZ sometimes return
//    an empty image (good, because we can cache that) but sometimes
//    with a 404 (bad, because we can't but want to, as they'll
//    never work) -- so we may need to "remember" the 404 to reduce
//    network traffic to the proxy

const HUCS = [
  "01040001",
  "01040002",
  "01060002",
  "01060003",
  "01070001",
  "01070002",
  "01070003" /* 👈 Washington */,
  "01070004",
  "01070006" /* 👈 Henniker */,
  "01080101",
  "01080103",
  "01080104",
  "01080106",
  "01080107",
  "01080201" /* 👈 also Washington ?? */,
  "01080202"
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-source-contours-2ft",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"]
})
export class OLSourceContours2ftComponent {
  maxRequests = input(8);
  olXYZ: OLXYZ;

  #http = inject(HttpClient);
  #layer = inject(OLLayerTileComponent);

  constructor() {
    this.olXYZ = new OLXYZ({
      attributions: [attribution],
      crossOrigin: "anonymous",
      tileLoadFunction: this.#loader.bind(this),
      url: "https://nhgeodata.unh.edu/nhgeodata/rest/services/EDP/LiDAR_Contours_2ft_XXXXXXXX_smooth_cached/MapServer/tile/{z}/{y}/{x}"
    });
    this.olXYZ.setProperties({ component: this }, true);
    this.#layer.olLayer.setSource(this.olXYZ);
  }

  #createImageBitmap(blob: Blob): Observable<ImageBitmap> {
    return new Observable<ImageBitmap>((observer) => {
      createImageBitmap(blob)
        .then((bitmap) => {
          observer.next(bitmap);
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }

  #loader(tile: OLImageTile, src: string): void {
    const img = tile.getImage() as HTMLImageElement;
    // 👇 buid a request for each HUC
    const requests = HUCS.map((huc) => {
      const url = `${
        environment.endpoints.proxy
      }/proxy/contours2ft?url=${encodeURIComponent(
        src.replace("XXXXXXXX", huc)
      )}`;
      return this.#http.get(url, { responseType: "blob" }).pipe(
        catchError(() => of(null)),
        filter((blob) => blob !== null),
        mergeMap((blob: Blob) => this.#createImageBitmap(blob)),
        catchError(() => of(null)),
        filter((bitmap: ImageBitmap) => bitmap !== null)
      );
    });
    // 👇 run the requests with a maximum concurrency
    merge(...requests, this.maxRequests())
      .pipe(toArray())
      .subscribe((bitmaps: ImageBitmap[]) => {
        // 👇 composite the bitmaps into a single canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 256;
        canvas.height = 256;
        bitmaps.forEach((bitmap) => ctx.drawImage(bitmap, 0, 0));
        // 👇 load the canvas into the tile
        img.src = canvas.toDataURL();
      });
  }
}
