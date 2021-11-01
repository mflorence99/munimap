import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  styleUrls: ['./login.scss'],
  templateUrl: './login.html'
})
export class LoginPage {}
