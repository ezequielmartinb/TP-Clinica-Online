import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroDatoExtra'
})
export class FiltroDatoExtraPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
