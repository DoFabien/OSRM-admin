import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sizeFile'
})
export class SizeFilePipe implements PipeTransform {
  private units = ['bit', 'Ko', 'Mo', 'Go', 'To', 'bps', 'dpi'];
  transform(bytes: number = 0, precision: number = 2): string {
    if (!bytes) {
      return null;
    }
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) {
      return bytes.toString();
    }
    let unit = 0;
    while (bytes >= 1024) {
      bytes /= 1024;
      unit++;
    }

    return bytes.toFixed(precision).toString().replace(/\./g, ',') + ' ' + this.units[unit];
  }

}


