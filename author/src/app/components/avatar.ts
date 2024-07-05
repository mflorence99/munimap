import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { computed } from "@angular/core";
import { input } from "@angular/core";

// 🔥 this is a quick-and-dirty hack to replace ngx-avatar as
//    it looks like that will not be updated for Ivy -- if that changes,
//    we'll toss this component

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-avatar",
  template: `
    <section class="avatar">{{ initials() }}</section>
  `,
  styles: [
    `
      .avatar {
        align-items: center;
        background-color: var(--primary-color);
        border-radius: 50%;
        color: var(--mat-gray-50);
        display: flex;
        height: 48px;
        justify-content: center;
        width: 48px;
      }
    `,
  ],
})
export class AvatarComponent {
  initials = computed(() => {
    if (this.name()) {
      const names = this.name().split(" ");
      const first = names.at(0);
      const last = names.at(-1);
      return `${first[0]}${last[0]}`.toUpperCase();
    } else return "";
  });

  name = input<string>();
}
