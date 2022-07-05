import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { KeyValue } from '@angular/common';
import { VersionService } from '@lib/services/version';

import { parcelPropertiesUsage } from '@lib/common';
import { parcelPropertiesUse } from '@lib/common';

import OLFillPattern from 'ol-ext/style/FillPattern';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-legend',
  styleUrls: ['./legend.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './legend.html'
})
export class ParcelsLegendComponent {
  // 👇 sucks we have to re-code these settings but they are approximations
  //    to the actual styles anyway, in order to contrast
  //    with a black background
  floodplain = '#03a9f480';
  wetland = new OLFillPattern({ color: '#03a9f4', pattern: 'swamp' });

  // eslint-disable-next-line @typescript-eslint/member-ordering
  parcelPropertiesUsage = parcelPropertiesUsage;
  parcelPropertiesUse = parcelPropertiesUse;

  constructor(private version: VersionService) {}

  reset(): void {
    this.version.hardReset();
  }

  trackByKeyValue(ix: number, item: KeyValue<string, string>): string {
    return item.key;
  }
}
