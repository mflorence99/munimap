import { Directive } from '@angular/core';
import { HostListener } from '@angular/core';

import { input } from '@angular/core';

@Directive({
  selector: '[appSelectOnFocus]',
  standalone: false
})
export class SelectOnFocusDirective {
  appSelectOnFocus = input<boolean>();

  @HostListener('focus', ['$event']) onFocus(event: any): void {
    setTimeout(() => {
      if (this.appSelectOnFocus()) event.target.select();
    }, 0);
  }
}
