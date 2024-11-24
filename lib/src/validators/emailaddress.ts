import { Directive } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { NG_VALIDATORS } from "@angular/forms";
import { ValidationErrors } from "@angular/forms";
import { Validator } from "@angular/forms";
import { ValidatorFn } from "@angular/forms";

function emailAddressValidatorFactory(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors => {
    const value = control.value;

    // 👉 quick exit if no value
    if (!value) return null;

    // 👉 every email must be empty or valid
    if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(value))
      return {
        invalidEmail: {
          valid: false
        }
      };

    return null;
  };
}

@Directive({
  providers: [
    { provide: NG_VALIDATORS, useExisting: EmailAddressValidator, multi: true }
  ],
  selector: "[appEmailAddress][ngModel]",
  standalone: false
})
export class EmailAddressValidator implements Validator {
  validator: ValidatorFn = emailAddressValidatorFactory();

  validate(control: AbstractControl): ValidationErrors {
    return this.validator(control);
  }
}
