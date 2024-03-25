import { DPWPage } from './page';
import { RootPage } from '../root/page';

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

import { combineLatest } from 'rxjs';
import { culvertConditions } from '@lib/common';
import { culvertFloodHazards } from '@lib/common';
import { culvertHeadwalls } from '@lib/common';
import { culvertMaterials } from '@lib/common';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';

interface Metric {
  enum: () => string[];
  key: (culvert) => string;
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
    <button (click)="export()" class="exporter" mat-icon-button>
      <fa-icon [icon]="['fas', 'download']" size="lg"></fa-icon>
    </button>

    <header class="header">
      <figure class="icon">
        <fa-icon [icon]="['fad', 'circle-notch']" size="2x"></fa-icon>
      </figure>
      <p class="title">Culverts</p>
      <p class="subtitle">
        @if (filteredBy) {
          {{ filteredBy }}
        } @else {
          Distribution and usage
        }
      </p>
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
                  <td [style.width.%]="20">
                    {{ key + (metric.tag === 'Opening' ? '"' : '') }}
                  </td>

                  @for (condition of allConditions; track condition) {
                    @if (breakdowns[metric.tag]?.[key]?.[condition]; as stats) {
                      <td [style.width.%]="80 / allConditions.length">
                        @if (stats.count && stats.length) {
                          <span>
                            {{ stats.count }}&ndash;{{ stats.length }}'
                          </span>
                        }
                      </td>
                    } @else {
                      <td></td>
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
      .exporter {
        position: absolute;
        right: 1rem;
        top: 1rem;
        z-index: 2;
      }

      .legend {
        border-collapse: collapse;
        font-size: smaller;
        width: 100%;

        td {
          padding: 1px 2px 2px 1px;
          white-space: nowrap;
        }

        td:not(:first-child) {
          border-left: 1px solid var(--mat-gray-800);
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
          border-left: 1px solid var(--mat-gray-800);
          padding-right: 8px;
          text-align: right;
        }

        tr {
          border-bottom: 1px solid var(--mat-gray-800);
        }
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
        return ['-'];
      },
      key: () => '-' /* 👈 fakeroo field in every row */,
      tag: 'All'
    },
    {
      enum: (): string[] => {
        return Object.keys(this.breakdowns['Opening'] ?? {}).sort();
      },
      key: (culvert) =>
        culvert.diameter
          ? String(culvert.diameter).padStart(2, ' ')
          : `${culvert.width}x${culvert.height}`,
      tag: 'Opening'
    },
    {
      enum: (): string[] => {
        return culvertMaterials as any;
      },
      key: (culvert) => culvert.material,
      tag: 'Material'
    },
    {
      enum: (): string[] => {
        return culvertHeadwalls as any;
      },
      key: (culvert) => culvert.headwall,
      tag: 'Headwall'
    },
    {
      enum: (): string[] => {
        return culvertFloodHazards as any;
      },
      key: (culvert) => culvert.floodHazard,
      tag: 'Hazard'
    }
  ];

  // 👇 metric -> value -> condition -> { count, length }
  breakdowns: Record<string, Record<string, Record<string, Statistics>>> = {};
  filteredBy: string;

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #root = inject(RootPage);
  #snapshot: CulvertProperties[] = [];

  export(): void {
    // 👇 build the data
    const lines = [];
    lines.push(
      `Location\tCondition\tCount\tDiameter\tWidth\tHeight\tLength\tHeadWall\tMaterial\tFlood Hazard\tYear\tDescription`
    );
    this.#snapshot.forEach((culvert) => {
      const c = copy(culvert);
      Object.keys(c).forEach((k) => (c[k] = c[k] || ''));
      lines.push(
        `${c.location}\t${c.condition}\t${c.count}\t${c.diameter}\t${c.width}\t${c.height}\t${c.length}\t${c.headwall}\t${c.material}\t${c.floodHazard}\t${c.year}\t${c.description}\t`
      );
    });
    // 👇 emit the data
    const blob = new Blob([lines.join('\n')], {
      type: 'text/tab-separated-values; charset=UTF-8'
    });
    saveAs(blob, `${this.filteredBy ?? 'ALL STREETS'} culverts.tsv`);
  }

  ngOnInit(): void {
    this.#handleStreams$();
  }

  #calcBreakdowns(culverts: CulvertProperties[]): void {
    this.allMetrics.forEach((metric) => {
      this.breakdowns[metric.tag] = {};
      culverts.forEach((culvert) => {
        const key = metric.key(culvert);
        const breakdown =
          this.breakdowns[metric.tag][key] ??
          culvertConditions.reduce((acc, condition) => {
            acc[condition] = { count: 0, length: 0 };
            return acc;
          }, {});
        breakdown[culvert.condition].count += culvert.count;
        breakdown[culvert.condition].length += culvert.length;
        this.breakdowns[metric.tag][key] = breakdown;
      });
    });
  }

  #handleStreams$(): void {
    combineLatest([
      this.landmarks$,
      (this.#root.routedPageComponent as DPWPage).filterFn$
    ])
      .pipe(
        takeUntil(this.#destroy$),
        map(([landmarks, filterFn]): [CulvertProperties[], string] => {
          const culverts = landmarks.filter(
            (landmark) => landmark.properties.metadata?.type === 'culvert'
          );
          const filteredCulverts = culverts.filter(filterFn);
          const filteredBy =
            culverts.length !== filteredCulverts.length
              ? filteredCulverts[0].properties.metadata.location
              : null;
          const properties = filteredCulverts.map(
            (culvert) => culvert.properties.metadata as CulvertProperties
          );
          return [properties, filteredBy];
        })
      )
      .subscribe(([culverts, filteredBy]) => {
        this.filteredBy = filteredBy;
        this.#snapshot = culverts;
        this.#calcBreakdowns(culverts);
        this.#cdf.detectChanges();
      });
  }
}
