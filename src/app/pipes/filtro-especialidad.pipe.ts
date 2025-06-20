import { Pipe, PipeTransform } from '@angular/core';
import { Especialidades, Turno } from '../modelos/interface';

@Pipe({
  name: 'filtroEspecialidad'
})
export class FiltroEspecialidadPipe implements PipeTransform {

  transform(turnos: Turno[], filtro: string, especialidades: Especialidades[]): Turno[] {
    if (!filtro?.trim()) return turnos;

    const texto = filtro.toLowerCase();
    return turnos.filter(turno => {
      const e = especialidades.find(es => es.id === turno.especialidad_id);
      return e?.nombre.toLowerCase().includes(texto);
    });
  }

}
