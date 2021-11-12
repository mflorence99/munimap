import { ConfirmDialogComponent } from '../components/confirm-dialog';
import { ConfirmDialogData } from '../components/confirm-dialog';
import { OLControlPrintProgressComponent } from './ol-control-printprogress';
import { OLMapComponent } from './ol-map';

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
    // 👉 the progress dialog allows the print to be cancelled
    this.#progressRef = this.dialog.open(OLControlPrintProgressComponent, {
      data: { map: this.map },
      disableClose: true
    });
    this.#progressRef.afterClosed().subscribe(() => {
      if (this.#renderCompleteKey) unByKey(this.#renderCompleteKey);
      this.#teardown();
    });
    // 👉 start printing
    this.#setup();
  }

  #setup(): void {
    this.#center = this.map.olView.getCenter();
    this.#zoom = this.map.olView.getZoom();
    // 🔥 needs to be configured
    this.map.olView.setZoom(13);
    // 👉 calculate extent of full map
    const [minX, minY, maxX, maxY] = this.map.boundary.features[0].bbox;
    const resolution = this.map.olView.getResolution();
    this.#px = getDistance([minX, maxY], [maxX, minY]) / resolution;
    this.#py = getDistance([minX, minY], [minX, maxY]) / resolution;
    // 👇 https://openlayers.org/en/latest/examples/print-to-scale.html
    const element = this.map.olMap.getTargetElement();
    element.style.height = `${this.#py}px`;
    element.style.overflow = 'visible';
    element.style.width = `${this.#px}px`;
    this.map.olMap.updateSize();
    this.map.zoomToBounds();
    // 👉 controls map configuration
    this.map.printing = true;
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
  }

  print(): void {
    const data: ConfirmDialogData = {
      content:
        'The entire map will be exported as a PNG file, suitable for large-format printing',
      title: 'Please confirm map print'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data, width: '25rem' })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.#printImpl();
      });
  }
}
