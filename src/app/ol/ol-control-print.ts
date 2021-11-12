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
  constructor(private map: OLMapComponent) {}

  // 🔥 all temporary

  print(): void {
    const zoom = this.map.olView.getZoom();
    this.map.olView.setZoom(15.5);

    const [minX, minY, maxX, maxY] = this.map.boundary.features[0].bbox;
    const resolution = this.map.olView.getResolution();
    const px = getDistance([minX, maxY], [maxX, minY]) / resolution;
    const py = getDistance([minX, minY], [minX, maxY]) / resolution;

    this.map.olMap.once('rendercomplete', () => {
      html2canvas(this.map.olMap.getViewport(), {
        height: py,
        useCORS: true,
        width: px
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          saveAs(blob, 'xxx.png');

          const element = this.map.olMap.getTargetElement();
          element.style.height = ``;
          element.style.overflow = 'hidden';
          element.style.width = ``;
          this.map.olMap.updateSize();
          this.map.olView.setZoom(zoom);
          this.map.printing = false;
        });
      });
    });

    const element = this.map.olMap.getTargetElement();
    element.style.height = `${py}px`;
    element.style.overflow = 'visible';
    element.style.width = `${px}px`;
    this.map.olMap.updateSize();
    this.map.zoomToBounds();
    this.map.printing = true;
  }
}
