import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ordenarPorDia'
})
export class OrdenarPorDiaPipe implements PipeTransform {

  private ordenDias: string[] = [
    'lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'
  ];
  
  transform(horarios: any[]): any[] {
    return horarios.slice().sort((a, b) => {
      const indexA = this.ordenDias.indexOf(a.dia.toLowerCase());
      const indexB = this.ordenDias.indexOf(b.dia.toLowerCase());
      return indexA - indexB;
    });
  }
}
