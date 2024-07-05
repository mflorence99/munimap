import { RootPage } from "../root/page";

import { ChangeDetectionStrategy } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";
import { CollectionReference } from "@angular/fire/firestore";
import { Firestore } from "@angular/fire/firestore";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { DestroyService } from "@lib/services/destroy";
import { AuthState } from "@lib/state/auth";
import { Profile } from "@lib/state/auth";
import { Map } from "@lib/state/map";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";

import { inject } from "@angular/core";
import { viewChild } from "@angular/core";
import { collection } from "@angular/fire/firestore";
import { collectionData } from "@angular/fire/firestore";
import { orderBy } from "@angular/fire/firestore";
import { query } from "@angular/fire/firestore";
import { where } from "@angular/fire/firestore";
import { workgroup } from "@lib/state/auth";
import { of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { takeUntil } from "rxjs/operators";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: "app-list",
  template: `
    <table matSort mat-table [dataSource]="dataSource">
      <ng-container matColumnDef="name">
        <th mat-header-cell mat-sort-header *matHeaderCellDef>Map Name</th>
        <td mat-cell *matCellDef="let element">{{ element.name }}</td>
      </ng-container>

      <ng-container matColumnDef="id">
        <th mat-header-cell mat-sort-header *matHeaderCellDef>Unique ID</th>
        <td mat-cell *matCellDef="let element">{{ element.id }}</td>
      </ng-container>

      <ng-container matColumnDef="owner">
        <th mat-header-cell mat-sort-header *matHeaderCellDef>Owner</th>
        <td mat-cell *matCellDef="let element">{{ element.owner }}</td>
      </ng-container>

      <ng-container matColumnDef="type">
        <th mat-header-cell mat-sort-header *matHeaderCellDef>Type</th>
        <td mat-cell *matCellDef="let element">{{ element.type }}</td>
      </ng-container>

      <ng-container matColumnDef="path">
        <th mat-header-cell mat-sort-header *matHeaderCellDef>Path</th>
        <td mat-cell *matCellDef="let element">{{ element.path }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
      <tr
        (click)="onLoadMap(row)"
        mat-row
        *matRowDef="let row; columns: columns"></tr>
    </table>

    <article class="filter">
      <fa-icon [icon]="['fas', 'search']"></fa-icon>

      <input
        #theSearcher
        (focus)="onSearch($any($event.srcElement).value)"
        (input)="onSearch($any($event.srcElement).value)"
        class="searcher"
        placeholder="Search text" />

      <button
        (click)="(theSearcher.value = '') || onSearch('')"
        [ngStyle]="{ visibility: theSearcher.value ? 'visible' : 'hidden' }"
        mat-icon-button>
        <fa-icon [icon]="['fas', 'times']" class="closer"></fa-icon>
      </button>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        overflow: auto;
        position: absolute;
        width: 100%;
      }

      .filter {
        align-items: center;
        background-color: rgba(var(--rgb-gray-100), 0.25);
        column-gap: 0.5rem;
        display: grid;
        grid-template-columns: auto 1fr auto;
        height: 3rem;
        padding: 0 0.5rem;
        position: absolute;
        right: 0.5rem;
        top: 0.5rem;
        z-index: 9999;
      }

      .searcher {
        background-color: transparent;
        border: none;
        color: var(--text-color);
        font-size: 1rem;
        height: 100%;
        width: 10rem;
      }

      .searcher::placeholder {
        color: rgba(var(--rgb-gray-50), 0.33);
      }

      table[mat-table] {
        width: 100%;

        td.mat-column-id {
          color: var(--accent-color);
        }

        td.mat-column-name {
          font-size: larger;
          font-weight: bold;
        }

        td.mat-column-path {
          font-family: monospace;
        }

        td.mat-column-type {
          color: var(--primary-color);
        }

        td.mat-column-type::first-letter {
          text-transform: uppercase;
        }

        tr.mat-mdc-row .mat-mdc-cell {
          border-bottom: 1px solid transparent;
          border-top: 1px solid transparent;
          cursor: pointer;
        }

        tr.mat-mdc-row:hover .mat-mdc-cell {
          border-color: var(--text-color);
        }
      }
    `,
  ],
})
export class ListPage implements OnInit {
  columns = ["name", "id", "owner", "type", "path"];
  dataSource: MatTableDataSource<Map>;
  profile$: Observable<Profile>;
  sort = viewChild(MatSort);

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #firestore = inject(Firestore);
  #root = inject(RootPage);
  #router = inject(Router);
  #store = inject(Store);

  constructor() {
    this.profile$ = this.#store.select(AuthState.profile);
    this.#root.setTitle("All Maps");
  }

  ngOnInit(): void {
    this.#handleAllMaps$().subscribe((maps: Map[]) => {
      this.dataSource = new MatTableDataSource(maps);
      this.dataSource.sort = this.sort();
      this.#cdf.detectChanges();
    });
  }

  onLoadMap(map: Map): void {
    this.#router.navigate([`/${map.type}/${map.id}`]);
  }

  onSearch(str: string): void {
    this.dataSource.filter = str.trim().toLowerCase();
  }

  #handleAllMaps$(): Observable<Map[]> {
    return this.profile$.pipe(
      takeUntil(this.#destroy$),
      mergeMap((profile) => {
        if (!profile?.email) return of([]);
        else {
          // 👇 show the N most recently-used maps
          console.log(
            `%cFirestore query: maps where owner in ${JSON.stringify(
              workgroup(profile),
            )} orderBy timestamp desc`,
            "color: goldenrod",
          );
          return collectionData<Map>(
            query(
              collection(this.#firestore, "maps") as CollectionReference<Map>,
              where("owner", "in", workgroup(profile)),
              orderBy("name"),
            ),
          );
        }
      }),
    );
  }
}
