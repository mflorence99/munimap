import { Directive } from "@angular/core";
import { ElementRef } from "@angular/core";

import { inject } from "@angular/core";

@Directive({
  selector: "img[appPattern]"
})
export class OLStylePatternDirective {
  // 👇 must be public!
  host = inject(ElementRef<HTMLImageElement>);

  matches(use: RegExp): boolean {
    return use.test(this.host.nativeElement.src);
  }

  size(): number[] {
    const img = this.host.nativeElement;
    return [img.width, img.height];
  }
}
