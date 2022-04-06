import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleWaterbodiesComponent)
    }
  ],
  selector: 'app-ol-style-waterbodies',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleWaterbodiesComponent implements OnChanges, Styler {
  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #drawWaterbody(): OLStyle {
    const fill = this.map.vars['--map-waterbody-fill'];
    return new OLStyle({
      fill: new OLFill({ color: `rgba(${fill}, 1)` }),
      stroke: null
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (): OLStyle => this.#drawWaterbody();
  }
}
