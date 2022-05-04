import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-streamcrossingproperties',
  templateUrl: './ol-popup-dpwproperties-impl.html',
  styleUrls: ['./ol-popup-dpwproperties.scss']
})
export class OLPopupStreamCrossingPropertiesComponent {
  @Input() properties: any;

  schema = [
    ['Location', 'RoadNameF'],
    ['Structure Type', 'StructType'],
    ['Structure Material', 'StructMat'],
    ['Structure Condition', 'StructCond'],
    ['Inlet Material', 'UsWingwallMat'],
    ['Inlet Condition', 'UsHwCon'],
    ['Outlet Material', 'DsWingwallMat'],
    ['Outlet Condition', 'DsHwCon']
  ];
}
