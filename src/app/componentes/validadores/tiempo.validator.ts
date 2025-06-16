import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import moment from 'moment-timezone';

export function validarFranjaHoraria(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const horaInicio = control.get('horaInicio')?.value;
    const horaFin = control.get('horaFin')?.value;

    if (!horaInicio || !horaFin) {
      return { camposRequeridos: true }; // Si faltan valores, el formulario es inválido
    }

    const inicio = moment(horaInicio, "HH:mm");
    const fin = moment(horaFin, "HH:mm");
    const duracion = fin.diff(inicio, 'minutes');

    return duracion === 30 ? null : { duracionInvalida: true }; // Validar que siempre sean 30 min
  };
}