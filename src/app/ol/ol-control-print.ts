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
  constructor(public map: OLMapComponent) {}

  // 👉 https://openlayers.org/en/latest/examples/print-to-scale.html

  print(): void {
    const zoom = this.map.olView.getZoom();
    this.map.olView.setZoom(13);

    const [minX, minY, maxX, maxY] = this.map.boundary.features[0].bbox;
    const resolution = this.map.olView.getResolution();
    const px = getDistance([minX, maxY], [maxX, minY]) / resolution;
    const py = getDistance([minX, minY], [minX, maxY]) / resolution;

    this.map.olMap.once('rendercomplete', () => {
      html2canvas(this.map.olMap.getViewport(), {
        height: py,
        // ignoreElements: () => false,
        useCORS: true,
        width: px
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          saveAs(blob, 'xxx.png');
          this.map.olMap.getTargetElement().style.overflow = 'hidden';
          this.map.olMap.getTargetElement().style.width = ``;
          this.map.olMap.getTargetElement().style.height = ``;
          this.map.olMap.updateSize();
          this.map.olView.setZoom(zoom);
        });
      });
    });

    this.map.olMap.getTargetElement().style.overflow = 'visible';
    this.map.olMap.getTargetElement().style.width = `${px}px`;
    this.map.olMap.getTargetElement().style.height = `${py}px`;
    this.map.olMap.updateSize();
    this.map.zoomToBounds();
  }
}
