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
  @Input() zoom: number;

  constructor(public map: OLMapComponent) {}

  onZoomChange(zoom: number): void {
    this.zoom = zoom;
    this.map.olView.animate({
      duration: 250,
      zoom
    });
  }
}
