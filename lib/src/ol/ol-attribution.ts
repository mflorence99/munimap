import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-attribution',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAttributionComponent {
  constructor(private host: ElementRef) {}

  getAttribution(): string {
    return this.host.nativeElement.innerHTML;
  }
}
