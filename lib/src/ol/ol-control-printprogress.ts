import { OLMapComponent } from "./ol-map";

import { ChangeDetectionStrategy } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { Component } from "@angular/core";
import { OnDestroy } from "@angular/core";
import { OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EventsKey as OLEventsKey } from "ol/events";
import { TileSourceEvent as OLTileSourceEvent } from "ol/source/Tile";

import { inject } from "@angular/core";
import { input } from "@angular/core";
import { unByKey } from "ol/Observable";

import OLUrlTile from "ol/source/UrlTile";

export interface PrintProgressData {
  map: OLMapComponent;
  px: number;
  py: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "ol-control-printprogress",
  template: `
    <h1 mat-dialog-title>Print Progress</h1>

    <article mat-dialog-content>
      @if (isStarting()) {
        <p>Preparing map for printing &hellip;</p>
      }
      @if (isComplete()) {
        <p>Cleaning up &hellip;</p>
      }
      @if (isRunning()) {
        <p>Loaded {{ numLoaded }} of {{ numLoading }} tiles &hellip;</p>
      }

      <br />

      <mat-progress-bar
        [mode]="isRunning() ? 'determinate' : 'indeterminate'"
        [value]="(numLoaded / numLoading) * 100"></mat-progress-bar>
    </article>

    <article mat-dialog-actions>
      <button [mat-dialog-close]="true" color="primary" mat-flat-button>
        CANCEL
      </button>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 30rem;
      }
    `
  ]
})
export class OLControlPrintProgressComponent implements OnDestroy, OnInit {
  giveUpAfter = input(30 * 1000);

  numLoaded = 0;
  numLoading = 0;

  #cdf = inject(ChangeDetectorRef);
  #data: PrintProgressData = inject(MAT_DIALOG_DATA);
  #eventKeys: OLEventsKey[];
  #interval: any;
  #timestamp = Date.now();

  isComplete(): boolean {
    return this.numLoaded > 0 && this.numLoading === this.numLoaded;
  }

  isRunning(): boolean {
    return this.numLoaded > 0 && this.numLoading !== this.numLoaded;
  }

  isStarting(): boolean {
    return this.numLoaded === 0;
  }

  ngOnDestroy(): void {
    this.#eventKeys.forEach((key) => unByKey(key));
    clearInterval(this.#interval);
  }

  ngOnInit(): void {
    this.#handleEvents();
    this.#monitorActivity();
  }

  #handleEvents(): void {
    const sources = this.#data.map.olMap
      .getLayers()
      .getArray()
      .filter((layer: any) => layer.getSource() instanceof OLUrlTile)
      .map((layer: any) => layer.getSource());
    this.#eventKeys = sources.flatMap((olSource) => [
      olSource.on("tileloadstart", this.#progress.bind(this)),
      olSource.on("tileloadend", this.#progress.bind(this))
    ]);
  }

  #monitorActivity(): void {
    this.#interval = setInterval(() => {
      // console.log({
      //   starting: this.isStarting(),
      //   complete: this.isComplete(),
      //   timestamp: this.#timestamp + this.giveUpAfter,
      //   now: Date.now(),
      //   giveUp: this.#timestamp + this.giveUpAfter < Date.now()
      // });
      if (
        this.isComplete() &&
        this.#timestamp + this.giveUpAfter() < Date.now()
      ) {
        clearInterval(this.#interval);
        this.#data.map.olMap.dispatchEvent("rendercomplete");
      }
    }, 1000);
  }

  #progress(event: OLTileSourceEvent): void {
    if (event.type === "tileloadstart") this.numLoading += 1;
    else if (event.type === "tileloadend") this.numLoaded += 1;
    this.#timestamp = Date.now();
    this.#cdf.markForCheck();
  }
}
