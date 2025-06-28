import { Component } from '@angular/core';
import { Especialista, Paciente, Turno, TurnoEnriquecido } from '../../modelos/interface';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)


@Component({
  selector: 'app-seccion-pacientes',
  imports: [CommonModule],
  templateUrl: './seccion-pacientes.component.html',
  styleUrl: './seccion-pacientes.component.css'
})
export class SeccionPacientesComponent {
  pacientes: Paciente[] = [];
  pacienteSeleccionado?: Paciente;
  turnosDelPaciente: TurnoEnriquecido[] = [];
  especialistaLogueadoId!: string;
  especialistas: Especialista[] = [];
  especialidades: Especialista[] = [];
  cargandoTurnos: boolean = false;

  async ngOnInit() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No se pudo obtener el usuario autenticado:', userError?.message);
      return;
    }
    this.especialistaLogueadoId = user.id;
    const especialistaId = user.id;

    // Obtener turnos finalizados del especialista
    const { data: turnos, error: turnosError } = await supabase
      .from('turnos')
      .select('id_paciente')
      .eq('id_especialista', especialistaId)
      .eq('estado', 'finalizado');

    if (turnosError) {
      console.error('Error al traer turnos:', turnosError.message);
      return;
    }
    console.log('Id de pacientes: ', turnos);
    
    const pacienteIds = [...new Set(turnos?.map(t => t.id_paciente))];

    if (pacienteIds.length === 0) {
      this.pacientes = [];
      return;
    }

    // Obtener datos de pacientes
    const { data: pacientesData, error: pacientesError } = await supabase
      .from('pacientes')
      .select('*')
      .in('id', pacienteIds);

    if (pacientesError) {
      console.error('Error al traer pacientes:', pacientesError.message);
      return;
    }

    this.pacientes = pacientesData || [];

    console.log('Listado de pacientes: ', this.pacientes);    

    // Cargar especialistas
    const { data: especialistasData, error: especialistasError } = await supabase
      .from('especialistas')
      .select('*');

    if (especialistasError) {
      console.error('Error al traer especialistas:', especialistasError.message);
      return;
    }

    this.especialistas = especialistasData || [];

    // Cargar especialidades
    const { data: especialidadesData, error: especialidadesError } = await supabase
      .from('especialidades')
      .select('*');

    if (especialidadesError) {
      console.error('Error al traer especialidades:', especialidadesError.message);
      return;
    }

    this.especialidades = especialidadesData || [];
  }

  async seleccionarPaciente(paciente: Paciente) {
    this.pacienteSeleccionado = paciente;
    this.cargandoTurnos = true;
    const { data: turnosRaw, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_paciente', paciente.id)
      .eq('estado', 'finalizado');

    if (error) {
      console.error('Error al traer turnos del paciente:', error.message);
      return;
    }

    this.turnosDelPaciente = (turnosRaw || [])
    .filter(turno => turno.id_especialista === this.especialistaLogueadoId)
    .map(turno => {
      const especialista = this.especialistas.find(e => e.id === turno.id_especialista);
      const especialidad = this.especialidades.find(es => es.id === turno.especialidad_id);

      return {
        fecha: turno.fecha,
        hora: turno.hora,
        resena: turno.resena,
        especialista: especialista ? `${especialista.nombre} ${especialista.apellido}` : 'Desconocido',
        especialidad: especialidad?.nombre || 'Desconocida'
      };
    });
    this.cargandoTurnos = false;
  }

  volver() {
    this.pacienteSeleccionado = undefined;
  }

}
