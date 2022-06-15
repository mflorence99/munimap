import { AbstractLegendComponent } from '../abstract-legend';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { TypeRegistry } from '@lib/services/typeregistry';
import { VersionService } from '@lib/services/version';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-property-legend',
  styleUrls: ['../legend.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './legend.html'
})
export class PropertyLegendComponent extends AbstractLegendComponent {
  constructor(registry: TypeRegistry, version: VersionService) {
    super(registry, version);
  }
}
