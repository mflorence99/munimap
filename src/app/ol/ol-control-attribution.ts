import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { ViewChild } from '@angular/core';

import OLLayer from 'ol/layer/Layer';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-attribution',
  templateUrl: './ol-control-attribution.html',
  styleUrls: ['./ol-control-attribution.scss']
})
export class OLControlAttributionComponent {
  @ViewChild('attribution') attribution: ElementRef<HTMLParagraphElement>;

  collapsed = true;

  constructor(private map: OLMapComponent) {}

  toggleAttributions(): void {
    this.collapsed = !this.collapsed;
    if (!this.collapsed) {
      const attributions = [];
      this.map.olMap.getLayers().forEach((layer: OLLayer<any>) => {
        layer
          ?.getSource()
          ?.getAttributions?.()?.()
          ?.forEach((attribution) => attributions.push(attribution));
      });
      this.attribution.nativeElement.innerHTML = attributions.join(' | ');
    }
  }
}