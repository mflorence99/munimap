import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrls: ['./avatar.scss']
})
export class AvatarComponent {
  #name: string;

  @Input() get name(): string {
    if (this.#name) {
      const names = this.#name.split(' ');
      const first = names.at(0);
      const last = names.at(-1);
      return `${first[0]}${last[0]}`.toUpperCase();
    } else return '';
  }

  set name(name: string) {
    this.#name = name;
  }
}
