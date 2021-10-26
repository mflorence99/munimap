import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: 'app-ol-control-zoom',
  templateUrl: './ol-control-zoom.html',
  styleUrls: ['./ol-control-zoom.scss']
})
export class OLControlZoomComponent {
  #zoom: number;
  @Input() resolution: number;

  @Input()
  get zoom(): number {
    return this.#zoom;
  }
  set zoom(zoom: number) {
    this.#zoom = zoom;
    this.resolution = this.map.olView.getResolutionForZoom(zoom);
  }

  @Input() zoomAnimationDuration = 250;

  constructor(public map: OLMapComponent) {}

  onZoomChange(zoom: number): void {
    this.zoom = zoom;
    this.map.olView.animate({
      duration: this.zoomAnimationDuration,
      zoom
    });
  }
}
