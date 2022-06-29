import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { CulvertProperties } from '@lib/common';
import { DestroyService } from '@lib/services/destroy';
import { Landmark } from '@lib/common';
import { LandmarksState } from '@lib/state/landmarks';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { VersionService } from '@lib/services/version';

import { map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';

interface Statistics {
  count: number;
  length: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-dpw-legend',
  styleUrls: ['./legend.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './legend.html'
})
export class DPWLegendComponent implements OnInit {
  byCondition: Record<string, Statistics> = {};
  byDiameter: Record<string, Statistics> = {};
  byMaterial: Record<string, Statistics> = {};

  @Select(LandmarksState) landmarks$: Observable<Landmark[]>;

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private version: VersionService
  ) {}

  #handleStreams$(): void {
    this.landmarks$
      .pipe(
        takeUntil(this.destroy$),
        map((landmarks): CulvertProperties[] =>
          landmarks
            .filter(
              (landmark) => landmark.properties.metadata?.type === 'culvert'
            )
            .map(
              (landmark) => landmark.properties.metadata as CulvertProperties
            )
        )
      )
      .subscribe((culverts: CulvertProperties[]) => {
        // 👇 common breakdown
        const breakdown = (keyfn, culverts): Record<string, Statistics> => {
          return culverts.reduce((acc, culvert) => {
            const stats = acc[keyfn(culvert)] ?? { count: 0, length: 0 };
            stats.count += 1;
            stats.length += culvert.length;
            acc[keyfn(culvert)] = stats;
            return acc;
          }, {});
        };
        // 👇 breakdown by metrics
        this.byCondition = breakdown(
          (culvert) => culvert.condition ?? 'Unknown',
          culverts
        );
        this.byDiameter = breakdown(
          (culvert) => String(culvert.diameter ?? 0),
          culverts
        );
        this.byMaterial = breakdown(
          (culvert) => culvert.material ?? 'Unknown',
          culverts
        );
        this.cdf.detectChanges();
      });
  }

  conditions(): string[][] {
    // 🔥 not the "real" colors, just ones that look good in the sidebar
    return [
      ['Unknown', '#616161'],
      ['Poor', '#c53929'],
      ['Fair', '#f4b400'],
      ['Good', '#0b8043']
    ];
  }

  diameters(): string[] {
    return Object.keys(this.byDiameter).sort((p, q) => Number(p) - Number(q));
  }

  materials(): string[] {
    return ['Unknown', 'Concrete', 'Plastic', 'Steel'];
  }

  ngOnInit(): void {
    this.#handleStreams$();
  }

  reset(): void {
    this.version.hardReset();
  }

  trackByCondition(ix: number, condition: string[]): string {
    return condition[0];
  }

  trackByDiameter(ix: number, diameter: string): string {
    return diameter;
  }

  trackByMaterial(ix: number, material: string): string {
    return material;
  }
}
