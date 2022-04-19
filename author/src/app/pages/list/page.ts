import { RootPage } from '../root/page';

import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { CollectionReference } from '@angular/fire/firestore';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { Firestore } from '@angular/fire/firestore';
import { Map } from '@lib/state/map';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Profile } from '@lib/state/auth';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { collection } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { orderBy } from '@angular/fire/firestore';
import { query } from '@angular/fire/firestore';
import { takeUntil } from 'rxjs/operators';
import { where } from '@angular/fire/firestore';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-list',
  styleUrls: ['./page.scss'],
  templateUrl: './page.html'
})
export class ListPage implements OnInit {
  columns = ['name', 'id', 'owner', 'type', 'path'];

  dataSource: MatTableDataSource<Map>;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private firestore: Firestore,
    private root: RootPage,
    private router: Router
  ) {
    this.root.setTitle('All Maps');
  }

  #handleAllMaps$(): Observable<Map[]> {
    return this.profile$.pipe(
      takeUntil(this.destroy$),
      mergeMap((profile) => {
        if (!profile?.email) return of([]);
        else {
          // 👇 show the N most recently-used maps
          const workgroup = AuthState.workgroup(profile);
          console.log(
            `%cFirestore query: maps where owner in ${JSON.stringify(
              workgroup
            )} orderBy timestamp desc`,
            'color: goldenrod'
          );
          return collectionData<Map>(
            query(
              collection(this.firestore, 'maps') as CollectionReference<Map>,
              where('owner', 'in', workgroup),
              orderBy('name')
            )
          );
        }
      })
    );
  }

  load(row: any): void {
    this.router.navigate([`/${row.type}/${row.id}`]);
  }

  ngOnInit(): void {
    this.#handleAllMaps$().subscribe((maps: Map[]) => {
      this.dataSource = new MatTableDataSource(maps);
      this.dataSource.sort = this.sort;
      this.cdf.detectChanges();
    });
  }
}
