import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dni'
})
export class DniPipe implements PipeTransform {

  transform(valor: number | string): string {
    const limpio = valor.toString().replace(/\D/g, '');
    const es8 = limpio.length === 8;

    const dni = es8 ? limpio : limpio.padStart(7, '0'); 

    const formato = es8 
      ? dni.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')
      : dni.replace(/(\d{1})(\d{3})(\d{3})/, '$1.$2.$3');

    return formato;
  }
}
