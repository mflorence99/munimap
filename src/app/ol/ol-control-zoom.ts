import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: 'app-ol-control-zoom',
  templateUrl: './ol-control-zoom.html',
  styleUrls: ['./ol-control-zoom.scss']
})
export class OLControlZoomComponent {
  @Input() resolution: number;
  @Input() zoom: number;
  @Input() zoomAnimationDuration = 250;

  constructor(private cdf: ChangeDetectorRef, public map: OLMapComponent) {
    this.map.zoomChange.subscribe((zoom) => {
      this.zoom = zoom;
      this.resolution = this.map.olView.getResolutionForZoom(zoom);
      this.cdf.detectChanges();
    });
  }

  onZoomChange(zoom: number): void {
    this.zoom = zoom;
    this.map.olView.animate({
      duration: this.zoomAnimationDuration,
      zoom
    });
  }
}
