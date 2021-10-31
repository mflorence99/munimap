import { AuthState } from '../state/auth';
import { DestroyService } from '../services/destroy';
import { OLMapComponent } from '../ol/ol-map';
import { Parcel } from '../state/parcels';
import { Profile } from '../state/auth';

import { AngularFirestore } from '@angular/fire/firestore';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';

import { map } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-parcel-properties',
  styleUrls: ['./parcel-properties.scss'],
  templateUrl: './parcel-properties.html'
})
export class ParcelPropertiesComponent {
  allParcels$: Observable<Parcel[]>;

  @Input() map: OLMapComponent;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  constructor(
    private firestore: AngularFirestore,
    private destroy$: DestroyService
  ) {
    this.allParcels$ = this.#handleAllParcels$();
  }

  #handleAllParcels$(): Observable<Parcel[]> {
    return this.profile$.pipe(
      takeUntil(this.destroy$),
      mergeMap((profile) => {
        if (!profile?.email) return of([]);
        else {
          const workgroup = AuthState.workgroup(profile);
          const query = (ref): any =>
            ref
              .where('id', 'in', this.map.selector.selectedIDs)
              // 🔥 crap! can't use more than one "in"
              // .where('owner', 'in', workgroup)
              .where('path', '==', this.map.path)
              .orderBy('timestamp');
          return this.firestore
            .collection<Parcel>('parcels', query)
            .valueChanges()
            .pipe(
              tap(console.log),
              map((parcels) =>
                parcels.filter((parcel) => workgroup.includes(parcel.owner))
              )
            );
        }
      })
    );
  }
}
