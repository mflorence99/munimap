import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-404',
  styleUrls: ['./404.scss'],
  templateUrl: './404.html'
})
export class FourOFourPage {}
