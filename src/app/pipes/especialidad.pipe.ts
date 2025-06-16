import { Pipe, PipeTransform } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Pipe({
  name: 'especialidad'
})
export class EspecialidadPipe implements PipeTransform {

  async transform(value: string)
  {
    if (!value) return 'Especialidad desconocida';
    const idEspecialidad = parseInt(value, 10);    
    
    // Consultar la especialidad en Supabase
    const { data, error } = await supabase
      .from('especialidades')
      .select('nombre')
      .eq('id', idEspecialidad)
      .single();

    if (error) {
      console.error('Error obteniendo especialidad:', error.message);
      return 'Especialidad desconocida';
    }

    const nombreEspecialidad = data?.nombre || 'Especialidad desconocida';
    return nombreEspecialidad;
  }


}
