import { LegendComponent } from '../legend';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { TypeRegistry } from '@lib/services/typeregistry';
import { VersionService } from '@lib/services/version';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dpw-legend',
  styleUrls: ['../legend.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './legend.html'
})
export class DPWLegendComponent extends LegendComponent {
  constructor(registry: TypeRegistry, version: VersionService) {
    super(registry, version);
  }
}