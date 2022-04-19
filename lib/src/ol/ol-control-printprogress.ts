import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Inject } from '@angular/core';
import { Input } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { TileSourceEvent as OLTileSourceEvent } from 'ol/source/Tile';

import { unByKey } from 'ol/Observable';

import OLUrlTile from 'ol/source/UrlTile';

export interface PrintProgressData {
  map: OLMapComponent;
  px: number;
  py: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ol-control-printprogress',
  styleUrls: ['./ol-control-printprogress.scss'],
  templateUrl: './ol-control-printprogress.html'
})
export class OLControlPrintProgressComponent implements OnDestroy, OnInit {
  #eventKeys: OLEventsKey[];
  #interval: any;
  #timestamp = Date.now();

  @Input() giveUpAfter = 30 * 1000 /* 👈 seconds */;

  numLoaded = 0;
  numLoading = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PrintProgressData,
    private cdf: ChangeDetectorRef
  ) {}

  #handleEvents(): void {
    const sources = this.data.map.olMap
      .getLayers()
      .getArray()
      .filter((layer: any) => layer.getSource() instanceof OLUrlTile)
      .map((layer: any) => layer.getSource());
    this.#eventKeys = sources.flatMap((olSource) => [
      olSource.on('tileloadstart', this.#progress.bind(this)),
      olSource.on('tileloadend', this.#progress.bind(this))
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
        (this.isComplete() || this.isStarting()) &&
        this.#timestamp + this.giveUpAfter < Date.now()
      ) {
        clearInterval(this.#interval);
        this.data.map.olMap.dispatchEvent('rendercomplete');
      }
    }, 1000);
  }

  #progress(event: OLTileSourceEvent): void {
    if (event.type === 'tileloadstart') this.numLoading += 1;
    else if (event.type === 'tileloadend') this.numLoaded += 1;
    this.#timestamp = Date.now();
    this.cdf.markForCheck();
  }

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
}
