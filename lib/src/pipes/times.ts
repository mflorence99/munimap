import { Pipe } from '@angular/core';
import { PipeTransform } from '@angular/core';

// 👀  https://stackoverflow.com/questions/36535629/repeat-html-element-multiple-times-using-ngfor-based-on-a-number

@Pipe({ name: 'times' })
export class TimesPipe implements PipeTransform {
  transform(value: number): any {
    const iterable = <Iterable<any>>{};
    iterable[Symbol.iterator] = function* (): any {
      let n = 0;
      while (n < value) {
        yield n++;
      }
    };
    return iterable;
  }
}
