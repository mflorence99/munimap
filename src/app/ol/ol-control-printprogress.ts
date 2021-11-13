import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { TileSourceEvent as OLTileSourceEvent } from 'ol/source/Tile';

import { unByKey } from 'ol/Observable';

import OLBaseTileLayer from 'ol/layer/BaseTile';
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
  #olSources: OLUrlTile[];

  numLoaded = 0;
  numLoading = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PrintProgressData,
    private cdf: ChangeDetectorRef
  ) {
    this.#olSources = data.map.olMap
      .getLayers()
      .getArray()
      .filter(
        (layer: OLBaseTileLayer<any>) => layer.getSource() instanceof OLUrlTile
      )
      .map((layer: OLBaseTileLayer<any>) => layer.getSource());
    // 👉 assumes 256 x 256 tiles
    console.log({ data });
    this.numLoading = Math.round(
      (data.px / 256) * (data.py / 256) * this.#olSources.length
    );
  }

  #progress(event: OLTileSourceEvent): void {
    if (event.type === 'tileloadstart') this.numLoading += 1;
    else if (event.type === 'tileloadend') this.numLoaded += 1;
    this.cdf.markForCheck();
  }

  ngOnDestroy(): void {
    this.#eventKeys.forEach((key) => unByKey(key));
  }

  ngOnInit(): void {
    this.#eventKeys = this.#olSources.flatMap((olSource) => [
      // olSource.on('tileloadstart', this.#progress.bind(this)),
      olSource.on('tileloadend', this.#progress.bind(this))
    ]);
  }
}
