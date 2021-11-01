import { Directive } from '@angular/core';
import { ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appContextMenuComponentHost]'
})
export class ContextMenuComponentHostDirective {
  constructor(public vcRef: ViewContainerRef) {}
}
