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

import OLFill from 'ol/style/Fill';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleFloodplainComponent)
    }
  ],
  selector: 'app-ol-style-floodplain',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleFloodplainComponent implements OnChanges, Styler {
  @Input() opacity = 0.1;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #drawFloodplain(): OLStyle {
    const fill = this.map.vars['--map-floodplain-fill'];
    return new OLStyle({
      fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
      stroke: null
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (): OLStyle => this.#drawFloodplain();
  }
}
