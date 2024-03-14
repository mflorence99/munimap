import { OLPopupDPWPropertiesComponent } from './ol-popup-dpwproperties';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { inject } from '@angular/core';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-culvertproperties',
  templateUrl: './ol-popup-dpwproperties-impl.html',
  styleUrls: ['../ol-popup-abstractproperties.scss']
})
export class OLPopupCulvertPropertiesComponent {
  container = inject(OLPopupDPWPropertiesComponent);

  schema = [
    ['Location', 'location'],
    ['Description', 'description'],
    ['Opening', 'dimension', 'inches'],
    ['Length', 'length', 'feet'],
    ['Count', 'count', 'x'],
    ['Material', 'material'],
    ['Condition', 'condition'],
    ['Headwall', 'headwall'],
    ['Flood Hazard', 'floodHazard'],
    ['Year Re/built', 'year']
  ];

  #properties: any;

  @Input() get properties(): any {
    return this.#properties;
  }

  set properties(properties: any) {
    if (properties) {
      this.#properties = copy(properties);
      Object.defineProperty(this.#properties, 'dimension', {
        get: () =>
          this.#properties.diameter ||
          `${this.#properties.width}x${this.#properties.height}`
      });
    } else this.#properties = null;
  }
}
