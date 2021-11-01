import { AuthState } from '../state/auth';
import { ContextMenuComponent } from './contextmenu-component';
import { DestroyService } from '../services/destroy';
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

import OLFeature from 'ol/Feature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-parcel-properties',
  styleUrls: ['./contextmenu-component.scss', './parcel-properties.scss'],
  templateUrl: './parcel-properties.html'
})
export class ParcelPropertiesComponent implements ContextMenuComponent {
  @Input() features: OLFeature<any>[];

  parcels$: Observable<Parcel[]>;

  @Input() path: string;

  @Select(AuthState.profile) profile$: Observable<Profile>;

  @Input() selectedIDs: string[];

  constructor(
    private firestore: AngularFirestore,
    private destroy$: DestroyService
  ) {
    this.parcels$ = this.#handleParcels$();
  }

  #handleParcels$(): Observable<Parcel[]> {
    return this.profile$.pipe(
      takeUntil(this.destroy$),
      mergeMap((profile) => {
        if (!profile?.email) return of([]);
        else {
          const workgroup = AuthState.workgroup(profile);
          const query = (ref): any =>
            ref
              .where('id', 'in', this.selectedIDs)
              // 🔥 crap! can't use more than one "in"
              //    .where('owner', 'in', workgroup)
              .where('path', '==', this.path)
              .orderBy('timestamp');
          return this.firestore
            .collection<Parcel>('parcels', query)
            .valueChanges()
            .pipe(
              map((parcels) =>
                parcels.filter((parcel) => workgroup.includes(parcel.owner))
              )
            );
        }
      })
    );
  }
}
