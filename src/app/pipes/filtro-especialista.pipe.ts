import { Pipe, PipeTransform } from '@angular/core';
import { Especialista, Turno } from '../modelos/interface';

@Pipe({
  name: 'filtroEspecialista'
})
export class FiltroEspecialistaPipe implements PipeTransform {

  transform(turnos: Turno[], filtro: string, especialistas: Especialista[]): Turno[] {
    if (!filtro?.trim()) return turnos;

    const texto = filtro.toLowerCase();
    return turnos.filter(turno => {
      const e = especialistas.find(es => es.id === turno.id_especialista);
      const nombreCompleto = `${e?.nombre ?? ''} ${e?.apellido ?? ''}`.toLowerCase();
      return nombreCompleto.includes(texto);
    });
  }


}
