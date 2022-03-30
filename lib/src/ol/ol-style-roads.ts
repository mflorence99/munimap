import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { RoadProperties } from '../geojson';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStrokePattern from 'ol-ext/style/StrokePattern';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleRoadsComponent)
    }
  ],
  selector: 'app-ol-style-roads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleRoadsComponent implements OnChanges, Styler {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 24;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 24;
  @Input() minFontSize = 4;
  @Input() minRoadWidth = 10 /* 👈 feet */;
  @Input() rightOfWayRatio = 3;
  @Input() showRoadLane = false;
  @Input() showRoadName = false;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #drawText(props: RoadProperties, resolution: number): OLText {
    const fontSize = this.#fontSize(resolution);
    // 👉 if the road label would be too small to see, don't show it
    if (fontSize < this.minFontSize) return null;
    else {
      const color =
        this.map.vars[`--map-road-text-color-${props.class ?? '0'}`];
      return new OLText({
        font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
        fill: new OLFill({ color: `rgba(${color}, 1)` }),
        placement: 'line',
        stroke: new OLStroke({
          color: `rgba(255, 255, 255, 1)`,
          width: 3
        }),
        text: props.class === 'VI' ? `${props.name} (Class VI)` : props.name
      });
    }
  }

  #fillLane(
    props: RoadProperties,
    resolution: number
  ): OLStroke | OLStrokePattern {
    const edge = this.map.vars[`--map-road-edge-${props.class ?? '0'}`];
    const lane = this.map.vars[`--map-road-lane-${props.class ?? '0'}`];
    const roadPixels = this.#roadPixels(props, resolution);
    // 👉 works for all road classifications
    const dflt = new OLStroke({
      color: `rgba(${lane}, 1)`,
      lineCap: 'round',
      lineJoin: 'bevel',
      width: roadPixels * 0.9
    });
    // 🐛 StrokePattern can throw InvalidState exception
    try {
      return props.class === 'VI'
        ? new OLStrokePattern({
            color: `rgba(${edge}, 1)`,
            fill: new OLFill({ color: `rgba(${lane}, 1)` }),
            pattern: 'conglomerate',
            scale: 0.66,
            width: roadPixels * 0.9
          })
        : dflt;
    } catch (ignored) {
      return dflt;
    }
  }

  #fontSize(resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxFontSize, this.fontSize / resolution);
  }

  #roadPixels(props: RoadProperties, resolution: number): number {
    // 👉 roadway width is in feet, resolution is pixels / meter
    //    multiply that for the right-of-way
    return (
      (Math.max(props.width, this.minRoadWidth) / (resolution * 3.28084)) *
      this.rightOfWayRatio
    );
  }

  #strokeEdge(props: RoadProperties, resolution: number): OLStroke {
    const edge = this.map.vars[`--map-road-edge-${props.class ?? '0'}`];
    const roadPixels = this.#roadPixels(props, resolution);
    return new OLStroke({
      color: `rgba(${edge}, 1)`,
      lineCap: 'butt',
      lineJoin: 'bevel',
      width: roadPixels
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (road: any, resolution: number): OLStyle[] => {
      const props = road.getProperties() as RoadProperties;
      // 👇 when we show lot lines, we may want to show the roadway
      //    and its name separately, because we want the lot lines
      //    to overlay the road but not the road name
      const styles: OLStyle[] = [];
      if (this.showRoadLane) {
        styles.push(
          new OLStyle({
            stroke: this.#strokeEdge(props, resolution)
          })
        );
        styles.push(
          new OLStyle({
            stroke: this.#fillLane(props, resolution)
          })
        );
      }
      if (this.showRoadName) {
        styles.push(
          new OLStyle({
            text: this.#drawText(props, resolution)
          })
        );
      }
      return styles;
    };
  }
}
