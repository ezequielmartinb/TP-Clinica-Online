import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtro'
})
export class FiltroPipe implements PipeTransform {

  transform(lista: any[], texto: string, campo: string): any[] {
    if (!lista || !texto || !campo) return lista;

    return lista.filter(item =>
      item[campo]?.toString().toLowerCase().includes(texto.toLowerCase())
    );
  }
}
