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

import { inject } from '@angular/core';
import { saveAs } from 'file-saver';
import { unByKey } from 'ol/Observable';

import html2canvas from 'html2canvas';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-print',
  template: `
    <button (click)="print()" mat-icon-button>
      <fa-icon [icon]="['fas', 'print']" size="2x"></fa-icon>
    </button>

    <canvas #canvas hidden></canvas>
  `,
  styles: [
    `
      :host {
        display: block;
        pointer-events: auto;
      }
    `
  ]
})
export class OLControlPrintComponent {
  @ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement>;

  @Input() dpi = 300;

  @Input() fileName: string;

  @Input() maxPrintSize = 12000;

  @Input() printSize: number[];

  #center: OLCoordinate;
  #dialog = inject(MatDialog);
  #dpi: number;
  #map = inject(OLMapComponent);
  #progressRef: MatDialogRef<OLControlPrintProgressComponent>;
  #px: number;
  #py: number;
  #renderCompleteKey: OLEventsKey;
  #zoom: number;

  print(): void {
    const data: ConfirmDialogData = {
      content: `The entire map will be exported as a JPEG file, suitable for large-format printing. It may take several minutes to produce. This map is designed to be printed on ${this.printSize[0]}" x ${this.printSize[1]}" paper.`,
      title: 'Please confirm map print'
    };
    this.#dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.#renderCompleteKey = this.#map.olMap.once('rendercomplete', () =>
            this.#printImpl()
          );
          this.#setup();
        }
      });
  }

  // 👇 we want a nomimal half-inch border around the map to accomodate
  //    the safe print area -- to preserve the aspect ratio, the border
  //    is narrower on the long side, wider on the short side -- that
  //    sounds counter-intuitive until you draw out what it looks like!

  #padding(cx: number, cy: number): number[] {
    // 👉 no padding for 8.5 x 11, as the print driver takes care
    //    of the safe area
    if (this.printSize[0] === 8.5 && this.printSize[1] === 11) return [0, 0];
    // 👉 other sizes are designed to be printed off-site, like
    //    posterburner.com, which supports full bleed, which we don't want
    else {
      const nominal = (cx + cy) / (this.printSize[0] + this.printSize[1]);
      const ar = cx / cy;
      const actual = ar > 1 ? [nominal, nominal / ar] : [nominal * ar, nominal];
      console.log(
        `%cPrint padding ${actual[0]} x ${actual[1]}`,
        'color: lightgreen'
      );
      return actual;
    }
  }

  #printArea(cx: number, cy: number): number[] {
    const nominal = [cx * this.dpi, cy * this.dpi];
    const ar = this.#map.orientation === 'portrait' ? cx / cy : cy / cx;
    const actual = [];
    if (ar > 1) {
      actual[0] = Math.min(nominal[0], this.maxPrintSize);
      actual[1] = actual[0] / ar;
    } else {
      actual[1] = Math.min(nominal[1], this.maxPrintSize);
      actual[0] = actual[1] * ar;
    }
    console.log(`%cPrint area ${actual[0]} x ${actual[1]}`, 'color: lightblue');
    return actual;
  }

  #printImpl(): void {
    html2canvas(this.#map.olMap.getViewport(), {
      height: this.#py,
      width: this.#px
    }).then((viewport) => {
      // 👉 compute padding and draw it around viewport
      const padding = this.#padding(this.#px, this.#py);
      const printout = this.canvas.nativeElement;
      printout.width = this.#px + padding[0];
      printout.height = this.#py + padding[1];
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
    this.#center = this.#map.olView.getCenter();
    this.#zoom = this.#map.olView.getZoom();
    this.#map.olView.setConstrainResolution(false);
    // 👉 calculate extent of full map
    const printArea = this.#printArea(this.printSize[0], this.printSize[1]);
    this.#px = printArea[0];
    this.#py = printArea[1];
    // 👉 the progress dialog allows the print to be cancelled
    const data: PrintProgressData = {
      map: this.#map,
      px: this.#px,
      py: this.#py
    };
    this.#progressRef = this.#dialog.open(OLControlPrintProgressComponent, {
      data,
      disableClose: true
    });
    this.#progressRef.afterClosed().subscribe(() => {
      unByKey(this.#renderCompleteKey);
      this.#teardown();
    });
    // 👇 https://openlayers.org/en/latest/examples/print-to-scale.html
    //    also -- we want the dialog to show quickly, before the map
    //    updateSize etc which takes a lot of dead time
    setTimeout(() => {
      const element = this.#map.olMap.getTargetElement();
      element.style.height = `${this.#py}px`;
      element.style.overflow = 'visible';
      element.style.width = `${this.#px}px`;
      this.#dpi = this.#map.dpi;
      // 👉 the actual dpi has been clamped!
      this.#map.dpi = printArea[0] / this.printSize[0];
      this.#map.olMap.updateSize();
      this.#map.zoomToBounds();
      // 👉 controls map configuration
      this.#map.printing = true;
    }, 0);
  }

  #teardown(): void {
    this.#progressRef.close();
    // 👇 https://openlayers.org/en/latest/examples/print-to-scale.html
    const element = this.#map.olMap.getTargetElement();
    element.style.height = ``;
    element.style.overflow = 'hidden';
    element.style.width = ``;
    this.#map.dpi = this.#dpi;
    this.#map.olMap.updateSize();
    this.#map.olView.setCenter(this.#center);
    this.#map.olView.setZoom(this.#zoom);
    // 👉 controls map configuration
    this.#map.printing = false;
  }
}
