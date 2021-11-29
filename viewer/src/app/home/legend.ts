import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Descriptor } from '@lib/services/typeregistry';
import { TypeRegistry } from '@lib/services/typeregistry';
import { VersionService } from '@lib/services/version';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-legend',
  styleUrls: ['./legend.scss', './sidebar.scss'],
  templateUrl: './legend.html'
})
export class LegendComponent {
  constructor(public registry: TypeRegistry, private version: VersionService) {}

  reset(): void {
    this.version.hardReset();
  }

  trackByUsage(ix: number, item: [any, Descriptor]): string {
    return item[0];
  }
}
