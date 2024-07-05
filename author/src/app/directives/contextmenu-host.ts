import { Directive } from "@angular/core";
import { ViewContainerRef } from "@angular/core";

import { inject } from "@angular/core";

@Directive({
  selector: "[appContextMenuHost]",
})
export class ContextMenuHostDirective {
  vcRef = inject(ViewContainerRef);
}
