import { AngularFirestore } from '@angular/fire/firestore';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Profile } from '@lib/state/auth';
import { Select } from '@ngxs/store';
import { VersionService } from '@lib/services/version';

import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { theState } from '@lib/geojson';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-navigator',
  styleUrls: ['./navigator.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './navigator.html'
})
export class NavigatorComponent implements OnInit {
  allMaps$: Observable<Map[]>;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  state = theState;

  @Input() title: string;

  constructor(
    private destroy$: DestroyService,
    private drawer: MatDrawer,
    private firestore: AngularFirestore,
    private version: VersionService
  ) {}

  #handleAllMaps$(): Observable<Map[]> {
    return this.profile$.pipe(
      takeUntil(this.destroy$),
      mergeMap((profile) => {
        if (!profile?.email) return of([]);
        else {
          const workgroup = AuthState.workgroup(profile);
          const query = (ref): any =>
            ref.where('owner', 'in', workgroup).orderBy('name');
          console.log(
            `%cFirestore query: maps where owner in ${JSON.stringify(
              workgroup
            )} orderBy name`,
            'color: goldenrod'
          );
          return this.firestore.collection<Map>('maps', query).valueChanges();
        }
      })
    );
  }

  close(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.allMaps$ = this.#handleAllMaps$();
  }

  reset(): void {
    this.version.hardReset();
  }

  trackByID(ix: number, map: Map): string {
    return map.id;
  }
}
