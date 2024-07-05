import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { Input } from "@angular/core";
import { Profile } from "@lib/state/auth";
import { User } from "@lib/state/auth";
import { Map } from "@lib/state/map";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-sink",
  template: ``,
  styles: [":host { display: none }"],
})
export class SinkComponent {
  // 👇 @Input works just fine here!

  @Input() mapState: Map;
  @Input() profile: Profile;
  @Input() user: User;
}
