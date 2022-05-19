import { Directive } from '@angular/core';
import { HostListener } from '@angular/core';
import { Input } from '@angular/core';

@Directive({
  selector: '[appSelectOnFocus]'
})
export class SelectOnFocusDirective {
  @Input() appSelectOnFocus: boolean;

  @HostListener('focus', ['$event']) onFocus(event: any): void {
    setTimeout(() => {
      if (this.appSelectOnFocus) event.target.select();
    }, 0);
  }
}
