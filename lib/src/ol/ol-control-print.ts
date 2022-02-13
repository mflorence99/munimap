import { ConfirmDialogComponent } from '../components/confirm-dialog';
import { ConfirmDialogData } from '../components/confirm-dialog';
import { OLControlPrintProgressComponent } from './ol-control-printprogress';
import { OLMapComponent } from './ol-map';
import { PrintProgressData } from './ol-control-printprogress';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate as OLCoordinate } from 'ol/coordinate';
import { ElementRef } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { ViewChild } from '@angular/core';

import { getDistance } from 'ol/sphere';
import { saveAs } from 'file-saver';
import { unByKey } from 'ol/Observable';

import html2canvas from 'html2canvas';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-print',
  templateUrl: './ol-control-print.html',
  styleUrls: ['./ol-control-print.scss']
})
export class OLControlPrintComponent {
  #center: OLCoordinate;
  #progressRef: MatDialogRef<OLControlPrintProgressComponent>;
  #px: number;
  #py: number;
  #renderCompleteKey: OLEventsKey;
  #zoom: number;

  @ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement>;

  @Input() fileName: string;

  @Input() resolution = 1.75 /* 👈 controls pixel density of print image */;

  constructor(private dialog: MatDialog, private map: OLMapComponent) {}

  // 👇 we want a nomimal half-inch border around the map to accomodate
  //    the safe print area -- to preserve the aspect ratio, the border
  //    is narrower on the long side, wider on the short side -- that
  //    sounds countr-intuitive until you draw out what it looks like!

  #padding(cx: number, cy: number): [number, number] {
    const nominal = (cx + cy) / 95; /* 🔥 magic number is paper size 45 x 60 */
    const ar = cx / cy;
    return ar > 1 ? [nominal, nominal / ar] : [nominal * ar, nominal];
  }

  #printImpl(): void {
    html2canvas(this.map.olMap.getViewport(), {
      height: this.#py,
      width: this.#px
    }).then((viewport) => {
      // 👉 compute padding and draw it around viewport
      const padding = this.#padding(this.#px, this.#py);
      const printout = this.canvas.nativeElement;
      printout.height = this.#py + padding[1];
      printout.width = this.#px + padding[0];
      const ctx = printout.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, printout.width, printout.height);
      ctx.drawImage(viewport, padding[0] / 2, padding[1] / 2);
      // 👉 now render printer as image
      printout.toBlob(
        (blob) => {
          saveAs(blob, `${this.fileName}.jpeg`);
          this.#teardown();
        },
        'image/jpeg',
        0.95 /* 👈 juggle quality with resolution to get best image */
      );
    });
  }

  #setup(): void {
    this.#center = this.map.olView.getCenter();
    this.#zoom = this.map.olView.getZoom();
    this.map.olView.setConstrainResolution(false);
    // 👉 calculate extent of full map
    const [minX, minY, maxX, maxY] = this.map.boundary.features[0].bbox;
    this.#px = getDistance([minX, minY], [maxX, minY]) / this.resolution;
    this.#py = getDistance([minX, minY], [minX, maxY]) / this.resolution;
    // 👉 the progress dialog allows the print to be cancelled
    const data: PrintProgressData = {
      map: this.map,
      px: this.#px,
      py: this.#py
    };
    this.#progressRef = this.dialog.open(OLControlPrintProgressComponent, {
      data,
      disableClose: true
    });
    this.#progressRef.afterClosed().subscribe((result: string) => {
      unByKey(this.#renderCompleteKey);
      // 👉 CANCEL or (in an emergency) PRINT AS-IS
      if (result === 'CANCEL') this.#teardown();
      else if (result === 'PRINT') this.#printImpl();
    });
    // 👇 https://openlayers.org/en/latest/examples/print-to-scale.html
    //    also -- we want the dialog to show quickly, before the map
    //    updateSize etc which takes a lot of dead time
    setTimeout(() => {
      const element = this.map.olMap.getTargetElement();
      element.style.height = `${this.#py}px`;
      element.style.overflow = 'visible';
      element.style.width = `${this.#px}px`;
      this.map.olMap.updateSize();
      this.map.zoomToBounds();
      // 👉 controls map configuration
      this.map.printing = true;
      this.map.cdf.markForCheck();
    }, 0);
  }

  #teardown(): void {
    this.#progressRef.close();
    // 👇 https://openlayers.org/en/latest/examples/print-to-scale.html
    const element = this.map.olMap.getTargetElement();
    element.style.height = ``;
    element.style.overflow = 'hidden';
    element.style.width = ``;
    this.map.olMap.updateSize();
    this.map.olView.setCenter(this.#center);
    this.map.olView.setZoom(this.#zoom);
    // 👉 controls map configuration
    this.map.printing = false;
    this.map.cdf.markForCheck();
  }

  print(): void {
    const data: ConfirmDialogData = {
      content:
        'The entire map will be exported as a JPEG file, suitable for large-format printing. It may take several minutes to produce.',
      title: 'Please confirm map print'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.#renderCompleteKey = this.map.olMap.once('rendercomplete', () =>
            this.#printImpl()
          );
          this.#setup();
        }
      });
  }
}
