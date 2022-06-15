import { Descriptor } from '@lib/services/typeregistry';
import { TypeRegistry } from '@lib/services/typeregistry';
import { VersionService } from '@lib/services/version';

import OLFillPattern from 'ol-ext/style/FillPattern';

export abstract class AbstractLegendComponent {
  // 👇 sucks we have to re-code these settings but they are approximations
  //    to the actual styles anyway, in order to contrast
  //    with a black background
  floodplain = '#03a9f480';
  wetland = new OLFillPattern({ color: '#03a9f4', pattern: 'swamp' });

  constructor(public registry: TypeRegistry, private version: VersionService) {}

  reset(): void {
    this.version.hardReset();
  }

  trackByUsage(ix: number, item: [any, Descriptor]): string {
    return item[0];
  }
}
