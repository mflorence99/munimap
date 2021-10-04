import { AuthState } from '../state/auth';
import { Logout } from '../state/auth';
import { UpdateUser } from '../state/auth';
import { User } from '../state/auth';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { Output } from '@angular/core';
import { PickPipe } from 'ngx-pipes';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PickPipe],
  selector: 'app-user-profile',
  styleUrls: ['./user-profile.scss'],
  templateUrl: './user-profile.html'
})
export class UserProfileComponent {
  @Output() done = new EventEmitter<void>();

  editMode = false;

  @Select(AuthState.user) user$: Observable<User>;

  constructor(private store: Store) {}

  logout(): void {
    this.store.dispatch(new Logout());
    this.done.emit();
  }

  update(changes: any): void {
    this.store.dispatch(new UpdateUser(changes));
    this.done.emit();
  }
}
