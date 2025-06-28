import { Pipe, PipeTransform } from '@angular/core';
import { Turno } from '../modelos/interface';

@Pipe({
  name: 'filtroDatoExtra'
})
export class FiltroDatoExtraPipe implements PipeTransform {

  transform(turnos: Turno[], filtro: string, historiaMap: Map<string, any>): Turno[] {
    if (!filtro?.trim() || !turnos || !historiaMap) return turnos;

    const texto = filtro.toLowerCase().trim();

    return turnos.filter(turno => {
      const historia = historiaMap.get(turno.id);
      if (!historia || !historia.datos_extra) return false;

      return Object.keys(historia.datos_extra).some(clave =>
        clave.toLowerCase().includes(texto)
      );
    });
  }
}
