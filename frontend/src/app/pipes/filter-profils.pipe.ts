import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterProfils'
})
export class FilterProfilsPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    const filtered = [];
    for (const el of value) {
      if (!args[el]) {
        filtered.push(el);
      }
    }
    return filtered;
  }

}
