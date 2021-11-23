import { OLMapComponent } from './ol-map';
import { environment } from '../environment';

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

  attributions: string[] = [];
  collapsed = true;

  env = environment;

  constructor(private map: OLMapComponent) {}

  toggleAttributions(): void {
    this.collapsed = !this.collapsed;
    if (!this.collapsed) {
      this.attributions = [];
      this.map.olMap.getLayers().forEach((layer: any) => {
        (layer as OLLayer<any>)
          ?.getSource()
          ?.getAttributions?.()?.()
          ?.forEach((attribution) => {
            if (!this.attributions.includes(attribution))
              this.attributions.push(attribution);
          });
      });
    }
  }

  trackByAttribution(ix: number, attribution: string): string {
    return attribution;
  }
}
