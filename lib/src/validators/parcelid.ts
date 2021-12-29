import { Directive } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Input } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';
import { OLControlSearchParcelsComponent } from '@lib/ol/parcels/ol-control-searchparcels';
import { OnInit } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { Validator } from '@angular/forms';
import { ValidatorFn } from '@angular/forms';

function parcelIDValidatorFactory(
  searcher: OLControlSearchParcelsComponent,
  original: any
): ValidatorFn {
  return (control: FormControl): ValidationErrors => {
    const value = control.value;

    // 👉 quick exit if no value or no searcher
    if (!value || !searcher) return null;

    // 👉 quick exit if return to orignal value
    if (value === original) return null;

    // 👉 error if duplicate
    if (searcher.searchablesByID[value])
      return {
        duplicate: {
          valid: false
        }
      };

    return null;
  };
}

@Directive({
  providers: [
    { provide: NG_VALIDATORS, useExisting: ParcelIDValidator, multi: true }
  ],
  selector: '[appParcelID][ngModel]'
})
export class ParcelIDValidator implements OnInit, Validator {
  @Input() appParcelID: [OLControlSearchParcelsComponent, any];

  validator: ValidatorFn;

  ngOnInit(): void {
    this.validator = parcelIDValidatorFactory(
      this.appParcelID[0],
      this.appParcelID[1]
    );
  }

  validate(control: FormControl): ValidationErrors {
    return this.validator(control);
  }
}
