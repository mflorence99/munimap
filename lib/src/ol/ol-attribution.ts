import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { ElementRef } from "@angular/core";

import { inject } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-attribution",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"]
})
export class OLAttributionComponent {
  #host = inject(ElementRef);

  getAttribution(): string {
    return this.#host.nativeElement.innerHTML;
  }
}
