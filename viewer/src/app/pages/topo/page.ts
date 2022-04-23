import { AbstractMapPage } from '../abstract-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-topo',
  styleUrls: ['../abstract-map.scss'],
  templateUrl: './page.html'
})
export class TopoPage extends AbstractMapPage {}
