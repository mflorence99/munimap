import { Directive } from '@angular/core';
import { ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appContextMenuHost]'
})
export class ContextMenuHostDirective {
  constructor(public vcRef: ViewContainerRef) {}
}
