import { MapableComponent } from './ol-mapable';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { contentChildren } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-layers',
  template: '<ng-content></ng-content>',
  styles: [':host { display: block; visibility: hidden }'],
  standalone: false
})
export class OLLayersComponent {
  layers = contentChildren(MapableComponent, { descendants: true });
}
