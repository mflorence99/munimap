import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

// 👀  https://twitter.com/Waterplea/status/1271037735332204544/photo/1

@Injectable()
export class DestroyService extends Observable<void> implements OnDestroy {
  #life$ = new Subject<void>();

  constructor() {
    super((subscriber) => this.#life$.subscribe(subscriber));
  }

  // 👇 because this service is provided in each component that needs it,
  //    it is destroyed when the component is destroyed
  ngOnDestroy(): void {
    this.#life$.next();
    this.#life$.complete();
  }
}
