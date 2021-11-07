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

// 👇 TEMPORARY

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-stonewalls',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleStoneWallsComponent implements OLStyleComponent {
  @Input() opacity = 0.33;
  @Input() pattern: OLStrokePatternType = 'rocks';
  @Input() threshold = 1;
  @Input() wallWidth = 7;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  style(): OLStyleFunction {
    return (
      stonewall: OLFeature<OLLineString>,
      resolution: number
    ): OLStyle => {
      const fill = this.map.vars['--map-stonewall-fill'];
      const rocks = this.map.vars['--map-stonewall-rocks'];
      // 👉 fontSize is proportional to the resolution,
      //    but no bigger than the nominal size specified
      const width = Math.min(this.wallWidth, this.wallWidth / resolution);
      if (resolution >= this.threshold) return null;
      else
        return new OLStyle({
          stroke: new OLStrokePattern({
            color: `rgba(${rocks}, ${this.opacity})`,
            fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
            pattern: this.pattern,
            scale: 2,
            width
          })
        });
    };
  }
}
