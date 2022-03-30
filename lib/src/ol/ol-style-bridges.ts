import { BridgeProperties } from '../geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFontSymbol from 'ol-ext/style/FontSymbol';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleBridgesComponent)
    }
  ],
  selector: 'app-ol-style-bridges',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleBridgesComponent implements OnChanges, Styler {
  @Input() bridgeWidth = 48 /* 👈 feet */;
  @Input() minBridgePixels = 6;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (bridge: any, resolution: number): OLStyle => {
      const props = bridge.getProperties() as BridgeProperties;
      const iconColor = this.map.vars[`--map-bridge-${props.rygb}-icon-color`];
      const lineColor = this.map.vars['--map-bridge-line-color'];
      // 👉 bridge width is in feet, resolution is pixels / meter
      const bridgeWidth = this.bridgeWidth / (resolution * 3.28084);
      // 👉 if bridge is too small to show, don't
      if (bridgeWidth < this.minBridgePixels) return null;
      else {
        return new OLStyle({
          image: new OLFontSymbol({
            color: `rgba(${iconColor}, 1)`,
            font: `'Font Awesome'`,
            fontStyle: 'bold',
            form: 'none',
            radius: bridgeWidth,
            stroke: new OLStroke({
              color: `rgba(${lineColor}, 1)`,
              width: 0.5
            }),
            text: '\uf00d' /* 👈 times */
          })
        });
      }
    };
  }
}
