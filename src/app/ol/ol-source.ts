import { OLMapComponent } from './ol-map';

import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { TileSourceEvent as OLTileSourceEvent } from 'ol/source/Tile';

import { unByKey } from 'ol/Observable';

import OLTileSource from 'ol/source/Tile';

export interface OLSourceProgress {
  numLoaded: number;
  numLoading: number;
}

// 👉 abstract component to track progress from a tiled source

@Component({
  selector: 'app-ol-tilesource',
  template: ''
})
export abstract class OLTileSourceComponent implements OnDestroy, OnInit {
  #tileLoadEndKey: OLEventsKey = null;
  #tileLoadStartKey: OLEventsKey = null;

  olSource: OLTileSource;

  progress: OLSourceProgress = {
    numLoaded: 0,
    numLoading: 0
  };

  progress$ = new Subject<OLSourceProgress>();

  constructor(protected map: OLMapComponent) {}

  #progress(event: OLTileSourceEvent): void {
    if (event.type === 'tileloadstart') this.progress.numLoading += 1;
    else if (event.type === 'tileloadend') this.progress.numLoaded += 1;
    if (this.progress.numLoading === this.progress.numLoaded) {
      this.progress.numLoaded = 0;
      this.progress.numLoading = 0;
    }
    this.progress$.next(this.progress);
  }

  ngOnDestroy(): void {
    if (this.#tileLoadEndKey) unByKey(this.#tileLoadEndKey);
    if (this.#tileLoadStartKey) unByKey(this.#tileLoadStartKey);
  }

  ngOnInit(): void {
    this.map.addProgress$(this.progress$);
    this.#tileLoadEndKey = this.olSource.on(
      'tileloadstart',
      this.#progress.bind(this)
    );
    this.#tileLoadStartKey = this.olSource.on(
      'tileloadend',
      this.#progress.bind(this)
    );
  }
}
