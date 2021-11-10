import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { getDistance } from 'ol/sphere';
import { saveAs } from 'file-saver';

import html2canvas from 'html2canvas';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-print',
  templateUrl: './ol-control-print.html',
  styleUrls: ['./ol-control-print.scss']
})
export class OLControlPrintComponent {
  #px: number;
  #py: number;

  constructor(public map: OLMapComponent) {}

  print(): void {
    this.map.olMap.once('postrender', () => {
      html2canvas(this.map.olMap.getViewport(), {
        height: this.#py,
        // ignoreElements: () => false,
        useCORS: true,
        width: this.#px
      }).then((canvas) => {
        canvas.toBlob((blob) => saveAs(blob, 'xxx.png'));
      });
    });

    this.map.olView.setZoom(13);

    const [minX, minY, maxX, maxY] = this.map.boundary.features[0].bbox;
    const resolution = this.map.olView.getResolution();
    this.#px = getDistance([minX, maxY], [maxX, minY]) / resolution;
    this.#py = getDistance([minX, minY], [minX, maxY]) / resolution;

    this.map.olMap.getTargetElement().style.width = `${this.#px}px`;
    this.map.olMap.getTargetElement().style.height = `${this.#py}px`;
    this.map.olMap.updateSize();
  }
}
