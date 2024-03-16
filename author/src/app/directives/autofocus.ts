import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]'
})
export class AutoFocusDirective {
  appAutoFocus = input<boolean>();

  #host = inject(ElementRef);

  constructor() {
    effect(() => {
      if (this.appAutoFocus()) this.#host.nativeElement.focus();
    });
  }
}
