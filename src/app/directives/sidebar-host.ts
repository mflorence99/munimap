import { Directive } from '@angular/core';
import { ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appSidebarHost]'
})
export class SidebarHostDirective {
  constructor(public vcRef: ViewContainerRef) {}
}
