import { Landmark } from "../common";
import { ConfirmDialogComponent } from "../components/confirm-dialog";
import { ConfirmDialogData } from "../components/confirm-dialog";
import { DestroyService } from "../services/destroy";
import { LandmarksActions } from "../state/landmarks";
import { OLInteractionAbstractRedrawComponent } from "./ol-interaction-abstractredraw";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { OnDestroy } from "@angular/core";
import { OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";

import { inject } from "@angular/core";
import { tap } from "rxjs/operators";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: "app-ol-interaction-redrawlandmark",
  template: "<ng-content></ng-content>",
  styles: [":host { display: none }"]
})
export class OLInteractionRedrawLandmarkComponent
  extends OLInteractionAbstractRedrawComponent
  implements OnDestroy, OnInit
{
  #dialog = inject(MatDialog);
  #store = inject(Store);

  ngOnDestroy(): void {
    this.onDestroy;
  }

  ngOnInit(): void {
    this.onInit();
  }

  saveRedraw(geojson: GeoJSON.Feature<any>): Observable<boolean> {
    const data: ConfirmDialogData = {
      content: `Do you want to save the new landmark alignment for ${this.feature.get(
        "name"
      )}?`,
      title: "Please confirm new alignment"
    };
    return this.#dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        tap((result) => {
          if (result) {
            // 👉 update the store
            const landmark: Partial<Landmark> = {
              id: this.feature.getId() as string,
              geometry: geojson.geometry,
              type: "Feature"
            };
            this.#store.dispatch(new LandmarksActions.UpdateLandmark(landmark));
          }
          // 👉 on CANCEL, reset geometry
          else this.resetRedraw();
        })
      );
  }
}
