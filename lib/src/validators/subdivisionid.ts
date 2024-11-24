import { Directive } from "@angular/core";
import { OnInit } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { NG_VALIDATORS } from "@angular/forms";
import { ValidationErrors } from "@angular/forms";
import { Validator } from "@angular/forms";
import { ValidatorFn } from "@angular/forms";

import { input } from "@angular/core";

interface Subdivision {
  area: number;
  id: string;
}

function subdivisionIDValidatorFactory(
  subdivisions: Subdivision[],
  ix: number
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors => {
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
    {
      provide: NG_VALIDATORS,
      useExisting: SubdivisionIDValidator,
      multi: true
    }
  ],
  selector: "[appSubdivisionID][ngModel]",
  standalone: false
})
export class SubdivisionIDValidator implements OnInit, Validator {
  appSubdivisionID = input<[Subdivision[], number]>();

  validator: ValidatorFn;

  ngOnInit(): void {
    this.validator = subdivisionIDValidatorFactory(
      this.appSubdivisionID()[0],
      this.appSubdivisionID()[1]
    );
  }

  validate(control: AbstractControl): ValidationErrors {
    return this.validator(control);
  }
}
