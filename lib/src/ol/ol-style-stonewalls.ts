import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStrokePatternType } from './ol-style';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFill from 'ol/style/Fill';
import OLStrokePattern from 'ol-ext/style/StrokePattern';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-stonewalls',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleStoneWallsComponent implements OLStyleComponent {
  @Input() maxWallPixels = 6;
  @Input() minWallPixels = 3;
  @Input() opacity = 0.33;
  @Input() pattern: OLStrokePatternType = 'rocks';
  @Input() wallWidth = 25 /* 👈 feet */;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #wallPixels(resolution: number): number {
    // 👉 wallWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(
      this.maxWallPixels,
      this.wallWidth / (resolution * 3.28084)
    );
  }

  style(): OLStyleFunction {
    return (stonewall: any, resolution: number): OLStyle => {
      const wallPixels = this.#wallPixels(resolution);
      // 👉 if the wall would be too small to see, don't show anything
      if (wallPixels < this.minWallPixels) return null;
      else {
        const fill = this.map.vars['--map-stonewall-fill'];
        const stroke = this.map.vars['--map-stonewall-rocks'];
        // 🐛 StrokePattern can throw InvalidState exception
        try {
          return new OLStyle({
            stroke: new OLStrokePattern({
              color: `rgba(${stroke}, ${this.opacity})`,
              fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
              pattern: this.pattern,
              scale: 2,
              width: wallPixels
            })
          });
        } catch (ignored) {
          return null;
        }
      }
    };
  }
}
