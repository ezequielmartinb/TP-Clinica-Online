import { Component, OnInit } from '@angular/core';
import { Especialidades, Especialista, HorarioEspecialista } from '../../modelos/interface';
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
  horarioEspecialista: HorarioEspecialista[] | null = [];
  async ngOnInit() 
  {
    await this.obtenerEspecialidades();
    await this.obtenerEspecialidadesDisponibles(); 
  }
  async obtenerEspecialidades() {
    const { data, error } = await supabase.from('especialidades').select('id, nombre');
    if (error) {
      console.error('Error obteniendo especialidades:', error);
      this.especialidades = []; // Asegurar que no sea null
      return;
    }
    this.especialidades = data as Especialidades[] ?? []; // Si `data` es null, asignar un array vacío
    console.log("Especialidades: ",this.especialidades);
    
  }
  
  async cargarEspecialistas(especialidadId: number) {
    const { data, error } = await supabase
      .from('especialistas')
      .select('id, nombre, apellido')
      .eq('id_especialidad', especialidadId); // Filtrar por especialidad seleccionada
  
    if (error) {
      console.error('Error obteniendo especialistas:', error.message);
      this.especialistas = []; // Evitar que sea null
      return;
    }
    // VER DE MODIFICAR ESTA LINEA
    this.especialistas = data as Especialista[] ?? []; // Si `data` es null, asignar un array vacío
    for (const especialista of this.especialistas) {
      this.horarioEspecialista = await this.cargarHorarios(especialista.id);
    }
  
  }
  
  async cargarHorarios(especialistaId: string) {
    const { data, error } = await supabase
      .from('horarios_especialistas')
      .select('dia_semana, hora_inicio, hora_fin')
      .eq('especialista_id', especialistaId);
  
    if (error) {
      console.error('Error obteniendo horarios del especialista:', error.message);
      return [];
    }
  
    return data as HorarioEspecialista[] ?? [];
  }
  
  onSelect(event: any) {
    const especialidadId = event?.target?.value ?? 0; // Si es null, asigna 0
    if (especialidadId !== 0) {
      this.cargarEspecialistas(especialidadId);
    }
  }  
  async obtenerEspecialidadesDisponibles() {
    // Obtener los ID de especialidades que tienen especialistas asignados
    const { data: especialidadesConEspecialistas, error } = await supabase
      .from('especialistas')
      .select('id_especialidad')
      .not('id_especialidad', 'is', null); // Asegurar que la especialidad no sea null
    console.log("especialidadesConEspecialistas", especialidadesConEspecialistas);
    
    if (error) {
      console.error("Error obteniendo especialidades con especialistas:", error.message);
      this.especialidades = [];
      return;
    }
  
    // Extraer solo los ID únicos
    const especialidadesIds = [...new Set(especialidadesConEspecialistas.map(e => e.id_especialidad))];
  
    // Obtener nombres de especialidades que coincidan con los ID filtrados
    const { data: especialidades, error: errorEspecialidades } = await supabase
      .from('especialidades')
      .select('id, nombre')
      .in('id', especialidadesIds); // Filtrar solo las especialidades con especialistas activos
  
    if (errorEspecialidades) {
      console.error("Error obteniendo especialidades:", errorEspecialidades.message);
      this.especialidades = [];
      return;
    }
  
    this.especialidades = especialidades as Especialidades[] ?? [];
  }
  
}