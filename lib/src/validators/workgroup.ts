import { Directive } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { NG_VALIDATORS } from "@angular/forms";
import { ValidationErrors } from "@angular/forms";
import { Validator } from "@angular/forms";
import { ValidatorFn } from "@angular/forms";

function workgroupValidatorFactory(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors => {
    const value = control.value;

    // 👉 quick exit if no value
    if (!value) return null;

    // 👉 error if more than 10 emails
    const emails = value.split(/[\n ;]+/g).filter((email) => !!email);
    if (emails.length > 10)
      return {
        tooMany: {
          valid: false,
        },
      };

    // 👉 every email must be empty or valid
    if (
      !emails.every(
        (email) =>
          !email ||
          /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email),
      )
    )
      return {
        invalidEmail: {
          valid: false,
        },
      };

    return null;
  };
}

@Directive({
  providers: [
    { provide: NG_VALIDATORS, useExisting: WorkgroupValidator, multi: true },
  ],
  selector: "[appWorkgroup][ngModel]",
})
export class WorkgroupValidator implements Validator {
  validator: ValidatorFn = workgroupValidatorFactory();

  validate(control: AbstractControl): ValidationErrors {
    return this.validator(control);
  }
}
