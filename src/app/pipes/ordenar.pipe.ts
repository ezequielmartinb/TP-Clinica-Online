import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ordenar'
})
export class OrdenarPipe implements PipeTransform {

  transform(lista: any[]): any[] {
    if (!lista) return [];

    return lista.slice().sort((a, b) => {
      const apellidoA = a.apellido?.toLowerCase() || '';
      const apellidoB = b.apellido?.toLowerCase() || '';

      return apellidoA.localeCompare(apellidoB);
    });
  }

}
