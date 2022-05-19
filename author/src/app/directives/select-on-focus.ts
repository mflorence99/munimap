import { Directive } from '@angular/core';
import { HostListener } from '@angular/core';

@Directive({
  selector: '[appSelectOnFocus]'
})
export class SelectOnFocusDirective {
  @HostListener('focus', ['$event']) onFocus(event: any): void {
    setTimeout(() => event.target.select(), 0);
  }
}
