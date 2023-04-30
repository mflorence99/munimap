import { AfterViewInit } from '@angular/core';
import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]'
})
export class AutoFocusDirective implements AfterViewInit, OnChanges {
  @Input() appAutoFocus: boolean;

  constructor(private host: ElementRef) {}

  ngAfterViewInit(): void {
    this.#focus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.#focus();
    }
  }

  #focus(): void {
    if (this.appAutoFocus) this.host.nativeElement.focus();
  }
}
