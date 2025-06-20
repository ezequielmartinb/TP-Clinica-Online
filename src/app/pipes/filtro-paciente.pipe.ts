import { Pipe, PipeTransform } from '@angular/core';
import { Paciente, Turno } from '../modelos/interface';

@Pipe({
  name: 'filtroPaciente'
})
export class FiltroPacientePipe implements PipeTransform {

  transform(turnos: Turno[], filtro: string, pacientes: Paciente[]): Turno[] {
    if (!filtro?.trim()) return turnos;

    const texto = filtro.toLowerCase();

    return turnos.filter(turno => {
      const paciente = pacientes.find(p => p.id === turno.id_paciente);
      return paciente?.apellido.toLowerCase().includes(texto);
    });
  }


}
