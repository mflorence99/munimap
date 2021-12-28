import { HammerGestureConfig } from '@angular/platform-browser';
import { Injectable } from '@angular/core';

import Hammer from 'hammerjs';

@Injectable()
export class HammerConfig extends HammerGestureConfig {
  overrides = {
    pan: { enable: false },
    pinch: { enable: false },
    press: { enable: false },
    rotate: { enable: false },
    swipe: { direction: Hammer.DIRECTION_ALL, enable: true },
    tap: { enable: true }
  };
}
