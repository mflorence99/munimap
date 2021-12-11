import { Subdivision } from './subdivide-parcel';

import { Directive } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Input } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';
import { OnInit } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { Validator } from '@angular/forms';
import { ValidatorFn } from '@angular/forms';

function subdivisionIDValidatorFactory(
  subdivisions: Subdivision[],
  ix: number
): ValidatorFn {
  return (control: FormControl): ValidationErrors => {
    const value = control.value;

    // 👉 quick exit if no value
    if (!value) return null;

    // 👉 error if duplicate
    if (
      subdivisions.some(
        (subdivision, iy) => subdivision.id === value && ix !== iy
      )
    )
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
    { provide: NG_VALIDATORS, useExisting: SubdivisionIDValidator, multi: true }
  ],
  selector: '[appSubdivisionID][ngModel]'
})
export class SubdivisionIDValidator implements OnInit, Validator {
  @Input() subdivision: number;
  @Input() subdivisions: Subdivision[];

  validator: ValidatorFn;

  ngOnInit(): void {
    this.validator = subdivisionIDValidatorFactory(
      this.subdivisions,
      this.subdivision
    );
  }

  validate(control: FormControl): ValidationErrors {
    return this.validator(control);
  }
}
