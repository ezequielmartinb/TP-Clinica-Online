import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import moment from 'moment-timezone';

export function validarFranjaHoraria(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const horaInicio = control.get('horaInicio')?.value;
    const horaFin = control.get('horaFin')?.value;

    if (!horaInicio || !horaFin) {
      return { camposRequeridos: true };
    }

    const inicio = moment(horaInicio, 'HH:mm');
    const fin = moment(horaFin, 'HH:mm');

    return inicio.isBefore(fin) ? null : { horaInvalida: true };
  };
}
