import { Component, OnInit } from '@angular/core';
import { Especialidades, Especialista, HorarioEspecialista, Paciente } from '../../modelos/interface';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-solicitar-turnos',
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitar-turnos.component.html',
  styleUrl: './solicitar-turnos.component.css'
})
export class SolicitarTurnosComponent implements OnInit
{
  especialidadSeleccionada = {id: 0, nombre: ""}
  especialistas:Especialista[] = [];
  especialidades: Especialidades[] = [];
  horarioEspecialista: HorarioEspecialista[] = [];
  especialistaSeleccionado: Especialista | null = null;
  bloquesHorario: string[] = [];
  pacientes:Paciente[] = [];
  esAdministrador: boolean = false; // esto lo podés setear según el rol del usuario logueado
  pacienteSeleccionado: Paciente | null = null;
  
  async ngOnInit() 
  {
    await this.obtenerEspecialidadesDisponibles(); 
    this.esAdministrador = localStorage.getItem('rol') == 'administrador';
    if(this.esAdministrador)
    {
      await this.cargarPacientes();
    }
  }
    
  async cargarEspecialistas(especialidadId: number): Promise<void> {
    try {
      console.log('id especialidad: ', especialidadId);
      
      // Buscar relaciones de especialistas que tengan esa especialidad
      const { data: relaciones, error } = await supabase
        .from('especialidades_de_especialistas')
        .select('id_especialista')
        .eq('id_especialidad', especialidadId)
        .not('id_especialista', 'is', null);
  
      if (error || !relaciones) {
        console.error('Error obteniendo relaciones de especialistas:', error?.message);
        this.especialistas = [];
        return;
      }
  
      const especialistasIds = [...new Set(relaciones.map(r => r.id_especialista))];
  
      if (especialistasIds.length === 0) {
        this.especialistas = [];
        return;
      }
  
      // Obtener datos de los especialistas por esos IDs
      const { data: especialistasData, error: errorEspecialistas } = await supabase
        .from('especialistas')
        .select('id, nombre, apellido, edad, dni, mail, contrasena, aprobado')
        .in('id', especialistasIds);

  
      if (errorEspecialistas || !especialistasData) {
        console.error('Error obteniendo especialistas:', errorEspecialistas?.message);
        this.especialistas = [];
        return;
      }
  
      this.especialistas = especialistasData;    
  
      console.log('Especialistas:', this.especialistas);
    } catch (error) {
      console.error('Error inesperado al cargar especialistas:', error);
      this.especialistas = [];
    }
  }
  
  onSelect(): void {
    const especialidadId = this.especialidadSeleccionada?.id;
    if (especialidadId) {
      this.cargarEspecialistas(especialidadId);
    }
    console.log('onselect', especialidadId);
    
  } 
  
  async obtenerEspecialidadesDisponibles(): Promise<void> {
    try {
      // Obtener los IDs únicos de especialidades que están asociadas a algún especialista
      const { data, error } = await supabase
        .from('especialidades_de_especialistas')
        .select('id_especialidad')
        .not('id_especialidad', 'is', null);
  
      if (error || !data) {
        console.error("Error obteniendo especialidades con especialistas:", error?.message);
        this.especialidades = [];
        return;
      }
  
      const especialidadesIds = [...new Set(data.map(e => e.id_especialidad))];
  
      if (especialidadesIds.length === 0) {
        this.especialidades = [];
        return;
      }
  
      // Obtener nombres de especialidades por los IDs obtenidos
      const { data: especialidades, error: errorEspecialidades } = await supabase
        .from('especialidades')
        .select('id, nombre')
        .in('id', especialidadesIds);
  
      if (errorEspecialidades || !especialidades) {
        console.error("Error obteniendo especialidades:", errorEspecialidades?.message);
        this.especialidades = [];
        return;
      }
  
      this.especialidades = especialidades;
    } catch (error) {
      console.error("Error inesperado:", error);
      this.especialidades = [];
    }
  }  
  async cargarHorariosDelEspecialista(): Promise<void> {
    const especialistaId = this.especialistaSeleccionado?.id;
    if (!especialistaId) return;
  
    const { data, error } = await supabase
      .from('horarios_especialistas')
      .select('id, especialista_id, dia_semana, hora_inicio, hora_fin')
      .eq('especialista_id', especialistaId);
    
    if (error) {
      console.error('Error al cargar horarios del especialista:', error.message);
      this.bloquesHorario = [];
      return;
    }
  
    this.horarioEspecialista = data;
    console.log('horarios: ', data);
    
  }
  generarBloques(horaInicio: string, horaFin: string): string[] {
    const bloques: string[] = [];
    let actual = new Date(`1970-01-01T${horaInicio}`);
    const fin = new Date(`1970-01-01T${horaFin}`);
  
    while (actual < fin) {
      bloques.push(actual.toTimeString().substring(0, 5)); // "HH:mm"
      actual.setMinutes(actual.getMinutes() + 30);
    }
  
    return bloques;
  }
  onSolicitarTurno(dia: string, hora: string): void {
    if(!this.esAdministrador)
    {
      console.log(`Solicitar turno el ${dia} a las ${hora} del paciente: ${localStorage.getItem('mail')}`);
    }
    else
    {
      console.log(`Solicitar turno el ${dia} a las ${hora} del paciente: ${this.pacienteSeleccionado}`);
      
    }
    // Acá podés continuar con validación + confirmación real del turno
  }
  
  async cargarPacientes()
  {
    const { data, error } = await supabase.from('pacientes').select('*');

    if (error) 
    {
      console.error('Error cargando pacientes:', error.message);
      return;
    }
    if(data != null)
    {
      this.pacientes = data as Paciente[];
    }
    console.log('Pacientes: ', this.pacientes);    
  }    
}