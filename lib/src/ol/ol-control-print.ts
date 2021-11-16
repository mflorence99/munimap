import { ConfirmDialogComponent } from '../components/confirm-dialog';
import { ConfirmDialogData } from '../components/confirm-dialog';
import { OLControlPrintProgressComponent } from './ol-control-printprogress';
import { OLMapComponent } from './ol-map';
import { PrintProgressData } from './ol-control-printprogress';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate as OLCoordinate } from 'ol/coordinate';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';

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
  #renderCompleteKey: OLEventsKey = null;
  #zoom: number;

  @Input() fileName: string;
  @Input() zoom = 15.8;

  constructor(private dialog: MatDialog, private map: OLMapComponent) {}

  #printImpl(): void {
    // 👉 tripped when print is complete
    this.#renderCompleteKey = this.map.olMap.once('rendercomplete', () => {
      html2canvas(this.map.olMap.getViewport(), {
        height: this.#py,
        useCORS: true,
        width: this.#px
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          saveAs(blob, `${this.fileName}.png`);
          this.#teardown();
        });
      });
    });
    this.#setup();
  }

  #setup(): void {
    this.#center = this.map.olView.getCenter();
    this.#zoom = this.map.olView.getZoom();
    this.map.olView.setZoom(this.zoom);
    // 👉 calculate extent of full map
    const [minX, minY, maxX, maxY] = this.map.boundary.features[0].bbox;
    const resolution = this.map.olView.getResolution();
    this.#px = getDistance([minX, maxY], [maxX, minY]) / resolution;
    this.#py = getDistance([minX, minY], [minX, maxY]) / resolution;
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
    this.#progressRef.afterClosed().subscribe(() => {
      if (this.#renderCompleteKey) unByKey(this.#renderCompleteKey);
      this.#teardown();
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
        'The entire map will be exported as a PNG file, suitable for large-format printing. It may take several minutes to produce.',
      title: 'Please confirm map print'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.#printImpl();
      });
  }
}
