import { Component } from '@angular/core';
import { Especialidades, Especialista, Paciente, Turno } from '../../modelos/interface';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiltroEspecialidadPipe } from "../../pipes/filtro-especialidad.pipe";
import { FiltroEspecialistaPipe } from "../../pipes/filtro-especialista.pipe";

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-turnos-admin',
  imports: [CommonModule, FormsModule, FiltroEspecialidadPipe, FiltroEspecialistaPipe],
  templateUrl: './turnos-admin.component.html',
  styleUrl: './turnos-admin.component.css'
})
export class TurnosAdminComponent 
{
  turnos: Turno[] = [];
  especialistas: Especialista[] = [];
  especialidades: Especialidades[] = [];
  pacientes: Paciente[] = [];

  filtroEspecialista = '';
  filtroEspecialidad = '';
  formularioActivoId: string | null = null;
  comentarioCancelacion = '';
  rol:string | null = '';
  isLoading = true;

  async ngOnInit() 
  {
    this.rol = localStorage.getItem('rol');
    await this.cargarDatos();
    this.isLoading = false;
  }

  async cargarDatos() 
  {
    const [turnosRes, especialistasRes, especialidadesRes, pacientesRes] = await Promise.all([
      supabase.from('turnos').select('*'),
      supabase.from('especialistas').select('*'),
      supabase.from('especialidades').select('id, nombre'),
      supabase.from('pacientes').select('*')
    ]);

    this.turnos = turnosRes.data ?? [];
    this.especialistas = especialistasRes.data ?? [];
    this.especialidades = especialidadesRes.data ?? [];
    this.pacientes = pacientesRes.data ?? [];    
  }

  getNombreEspecialista(id: string): string {
    const e = this.especialistas.find(x => x.id === id);
    return e ? `${e.apellido}, ${e.nombre}` : 'Desconocido';
  }

  getNombreEspecialidad(id: number): string {
    const esp = this.especialidades.find(e => e.id === id);
    return esp ? esp.nombre : 'Desconocida';
  }
  getNombrePaciente(id: string): string {
    const paciente = this.pacientes.find(e => e.id === id);
    return paciente ? `${paciente.apellido}, ${paciente.nombre}` : 'Desconocido';
  }

  abrirFormulario(turnoId: string) {
    this.formularioActivoId = turnoId;
    this.comentarioCancelacion = '';
  }

  cerrarFormulario() {
    this.formularioActivoId = null;
    this.comentarioCancelacion = '';
  }
  

  async cancelarTurno(turno: Turno) {
    if (!this.comentarioCancelacion.trim()) return;

    const { error } = await supabase
      .from('turnos')
      .update({ estado: 'cancelado' })
      .eq('id', turno.id);

    if (!error) {
      await supabase.from('turnos_cancelados').insert({
        id_turno: turno.id,
        motivo: this.comentarioCancelacion,
        accion: 'cancelar',
        rol_usuario: this.rol,
        fecha_registro: new Date().toISOString()
      });
      turno.estado = 'cancelado';
      this.cerrarFormulario();
    }
  }

  puedeCancelar(turno: Turno): boolean {
    return !['finalizado', 'cancelado', 'rechazado'].includes(turno.estado);
  }
}
