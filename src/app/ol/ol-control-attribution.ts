import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-attribution',
  templateUrl: './ol-control-attribution.html',
  styleUrls: ['./ol-control-attribution.scss']
})
export class OLControlAttributionComponent {}
