import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStrokePatternType } from './ol-style';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLLineString from 'ol/geom/MultiLineString';
import OLStrokePattern from 'ol-ext/style/StrokePattern';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-stonewalls',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleStoneWallsComponent implements OLStyleComponent {
  @Input() maxWallWidth = 6;
  @Input() minWallWidth = 3;
  @Input() opacity = 0.33;
  @Input() pattern: OLStrokePatternType = 'rocks';
  @Input() wallWidth = 7;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #wallWidth(resolution: number): number {
    // 👉 wallWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxWallWidth, this.wallWidth / resolution);
  }

  style(): OLStyleFunction {
    return (
      stonewall: OLFeature<OLLineString>,
      resolution: number
    ): OLStyle => {
      const wallWidth = this.#wallWidth(resolution);
      // 👉 if the wall would be too small to see, don't show anything
      if (wallWidth < this.minWallWidth) return null;
      else {
        const fill = this.map.vars['--map-stonewall-fill'];
        const rocks = this.map.vars['--map-stonewall-rocks'];
        return new OLStyle({
          stroke: new OLStrokePattern({
            color: `rgba(${rocks}, ${this.opacity})`,
            fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
            pattern: this.pattern,
            scale: 2,
            width: wallWidth
          })
        });
      }
    };
  }
}
