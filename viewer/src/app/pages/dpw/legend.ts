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

import { culvertConditions } from '@lib/common';
import { culvertFloodHazards } from '@lib/common';
import { culvertHeadwalls } from '@lib/common';
import { culvertMaterials } from '@lib/common';
import { map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';

interface Metric {
  enum: () => string[];
  key: string;
  tag: string;
}

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
  allConditions = culvertConditions;

  allMetrics: Metric[] = [
    {
      enum: (): string[] => {
        return [undefined];
      },
      key: '$fake$' /* 👈 fakeroo field in every row */,
      tag: 'Total'
    },
    {
      enum: (): string[] => {
        return Object.keys(this.breakdowns['diameter'] ?? {}).sort(
          (p, q) => Number(p) - Number(q)
        );
      },
      key: 'diameter',
      tag: 'Diameter'
    },
    {
      enum: (): string[] => {
        return culvertMaterials as any;
      },
      key: 'material',
      tag: 'Material'
    },
    {
      enum: (): string[] => {
        return culvertHeadwalls as any;
      },
      key: 'headwall',
      tag: 'Headwall'
    },
    {
      enum: (): string[] => {
        return culvertFloodHazards as any;
      },
      key: 'floodHazard',
      tag: 'Flood Hazard'
    }
  ];

  // 👇 metric -> value -> condition -> { count, length }
  breakdowns: Record<string, Record<string, Record<string, Statistics>>> = {};

  @Select(LandmarksState) landmarks$: Observable<Landmark[]>;

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private version: VersionService
  ) {}

  #calcBreakdowns(culverts: CulvertProperties[]): void {
    this.allMetrics.forEach((metric) => {
      this.breakdowns[metric.key] = {};
      culverts.forEach((culvert) => {
        const key = culvert[metric.key];
        const breakdown =
          this.breakdowns[metric.key][key] ??
          culvertConditions.reduce((acc, condition) => {
            acc[condition] = { count: 0, length: 0 };
            return acc;
          }, {});
        breakdown[culvert.condition].count += 1;
        breakdown[culvert.condition].length += culvert.length;
        this.breakdowns[metric.key][key] = breakdown;
      });
    });
    console.error(this.breakdowns);
  }

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
        this.#calcBreakdowns(culverts);
        this.cdf.detectChanges();
      });
  }

  ngOnInit(): void {
    this.#handleStreams$();
  }

  reset(): void {
    this.version.hardReset();
  }

  trackByKey(ix: number, key: string): string {
    return key;
  }

  trackByMetric(ix: number, metric: Metric): string {
    return metric.key;
  }
}
