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
  template: `
    <button (click)="reset()" class="reloader" mat-icon-button>
      <fa-icon [icon]="['fas', 'sync']" size="lg"></fa-icon>
    </button>

    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'circle-notch']" size="2x"></fa-icon>
      </figure>
      <p class="title">Culverts</p>
      <p class="subtitle">Distribution and usage</p>
    </header>

    <article class="form">
      @for (metric of allMetrics; track metric.key) {
        <table class="legend">
          <thead>
            <tr>
              <th>{{ metric.tag }}</th>
              @for (condition of allConditions; track condition) {
                <th>
                  <fa-icon
                    [icon]="['fas', 'circle']"
                    [style.color]="
                      'rgba(var(--map-culvert-' +
                      condition.toLowerCase() +
                      '-icon-color), 1)'
                    "></fa-icon>
                </th>
              }
            </tr>
          </thead>

          @if (metric.enum(); as keys) {
            <tbody>
              @for (key of keys; track key) {
                <tr>
                  <td [style.width.%]="25">
                    {{ key }}
                    @if (metric.key === 'diameter') {
                      <span>"</span>
                    }
                  </td>

                  @for (condition of allConditions; track condition) {
                    @if (breakdowns[metric.key]?.[key]?.[condition]; as stats) {
                      <td [style.width.%]="75 / allConditions.length">
                        @if (stats.count && stats.length) {
                          <span>
                            {{ stats.count }}&ndash;{{ stats.length }}'
                          </span>
                        }
                      </td>
                    }
                  }
                </tr>
              }
            </tbody>
          }
        </table>
      }
    </article>
  `,
  styles: [
    `
      .legend {
        border-collapse: collapse;
        width: 100%;

        td:not(:first-child) {
          font-size: smaller;
          text-align: right;
        }

        th {
          vertical-align: bottom;
        }

        th:first-child {
          text-align: left;
          text-transform: uppercase;
        }

        th:not(:first-child) {
          text-align: right;
        }
      }

      .reloader {
        position: absolute;
        right: 1rem;
        top: 1rem;
        z-index: 2;
      }
    `
  ],
  styleUrls: ['../../../../../lib/css/sidebar.scss']
})
export class DPWLegendComponent implements OnInit {
  @Select(LandmarksState) landmarks$: Observable<Landmark[]>;

  allConditions = culvertConditions;

  allMetrics: Metric[] = [
    {
      enum: (): string[] => {
        return [undefined];
      },
      key: '$fake$' /* 👈 fakeroo field in every row */,
      tag: 'All Culverts'
    },
    {
      enum: (): string[] => {
        return Object.keys(this.breakdowns['diameter'] ?? {}).sort(
          (p, q) => Number(p) - Number(q)
        );
      },
      key: 'diameter',
      tag: 'By Diameter'
    },
    {
      enum: (): string[] => {
        return culvertMaterials as any;
      },
      key: 'material',
      tag: 'By Material'
    },
    {
      enum: (): string[] => {
        return culvertHeadwalls as any;
      },
      key: 'headwall',
      tag: 'By Headwall'
    },
    {
      enum: (): string[] => {
        return culvertFloodHazards as any;
      },
      key: 'floodHazard',
      tag: 'By Flood Hazard'
    }
  ];

  // 👇 metric -> value -> condition -> { count, length }
  breakdowns: Record<string, Record<string, Record<string, Statistics>>> = {};

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private version: VersionService
  ) {}

  ngOnInit(): void {
    this.#handleStreams$();
  }

  reset(): void {
    this.version.hardReset();
  }

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
        breakdown[culvert.condition].count += culvert.count;
        breakdown[culvert.condition].length += culvert.length;
        this.breakdowns[metric.key][key] = breakdown;
      });
    });
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
}
