import { Component, OnInit } from '@angular/core';
import { Especialidades, Especialista, HorarioEspecialista, Paciente, Turno } from '../../modelos/interface';
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
  especialidadSeleccionada: Especialidades | null = null
  especialistas:Especialista[] = [];
  especialidades: Especialidades[] = [];
  horarioEspecialista: HorarioEspecialista[] = [];
  especialistaSeleccionado: Especialista | null = null;
  bloquesHorario: string[] = [];
  pacientes:Paciente[] = [];
  esAdministrador: boolean = false;
  pacienteSeleccionado: Paciente | null = null;
  proximosDias: Date[] = [];
  fechaSeleccionada: Date | null = null;
  diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  mensajeTurno: string | null = null;
  tipoMensajeTurno: 'exito' | 'error' | null = null;
  turnosExistentes: Turno[] = [];

  
  async ngOnInit() 
  {
    await this.obtenerEspecialidadesDisponibles(); 
    await this.cargarTurnosDelEspecialista();
    
    this.esAdministrador = localStorage.getItem('rol') == 'administrador';
    if(this.esAdministrador)
    {
      await this.cargarPacientes();
    }
    this.generarProximosDias();
    await Promise.all(
      this.proximosDias.map(d => this.cargarTurnosDelEspecialistaPorFecha(d))
    );
    
    console.log('especialidades: ', this.especialidades);
    
    
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
        .select('id, nombre, apellido, edad, dni, mail, contrasena, aprobado, imagen_perfil')
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
      // Paso 1: Obtener las especialidades relacionadas con al menos un especialista
      const { data: relaciones, error } = await supabase
        .from('especialidades_de_especialistas')
        .select('id_especialidad')
        .not('id_especialidad', 'is', null);
  
      if (error || !relaciones) {
        console.error("Error obteniendo relaciones:", error?.message);
        this.especialidades = [];
        return;
      }
  
      const especialidadesIds = [...new Set(relaciones.map(r => r.id_especialidad))];
  
      if (especialidadesIds.length === 0) {
        this.especialidades = [];
        return;
      }
  
      // Paso 2: Obtener datos completos de esas especialidades, incluyendo imagen_perfil
      const { data: especialidades, error: errorEspecialidades } = await supabase
        .from('especialidades')
        .select('id, nombre, imagen_perfil')
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

  async cargarTurnosDelEspecialista(): Promise<void> {
    if (!this.fechaSeleccionada || !this.especialistaSeleccionado) return;
  
    const fecha = this.fechaSeleccionada.toISOString().split('T')[0];
    console.log(this.especialistaSeleccionado.id);
    
  
    const { data, error } = await supabase
      .from('turnos')
      .select('id, fecha, hora, estado, id_paciente, id_especialista, especialidad_id, resena') // campos completos
      .eq('id_especialista', this.especialistaSeleccionado.id)
      .eq('fecha', fecha);
  
    if (error) {
      console.error('❌ Error al cargar turnos existentes:', error.message);
      return;
    }
  
    this.turnosExistentes = data || [];
    console.log('Turnos tomados: ',this.turnosExistentes);
  }  
  bloqueOcupado(hora: string): boolean {
    const horaCompleta = `${hora}:00`; // debe coincidir con el formato 'HH:mm:ss'
    return this.turnosExistentes.some(
      t => t.fecha === this.fechaSeleccionada?.toISOString().split('T')[0]
        && t.hora === horaCompleta
        && (t.estado === 'pendiente' || t.estado == 'aceptado')
    );
  }
  
  async onSolicitarTurno(dia: string, hora: string): Promise<void> {
    if (!this.fechaSeleccionada || !this.especialistaSeleccionado) return;
  
    const fecha = this.fechaSeleccionada.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const horaTurno = `${hora}:00`; // 'HH:mm:ss'
  
    const idPaciente = this.esAdministrador
      ? this.pacienteSeleccionado?.id
      : localStorage.getItem('id_usuario');
    
    if (!idPaciente) {
      console.log('⚠️ Debe seleccionar un paciente antes de solicitar un turno.');
      return;
    }
  
    const { error } = await supabase.from('turnos').insert({
      id_paciente: idPaciente,
      id_especialista: this.especialistaSeleccionado.id,
      especialidad_id: this.especialidadSeleccionada?.id,
      fecha,
      hora: horaTurno,
      estado: 'pendiente'
    });
  
    if (error) {
      this.tipoMensajeTurno = 'error';
      this.mensajeTurno = '❌ No se pudo registrar el turno. Verificá si ya existe uno en ese horario.';
      console.error(error.message);
    } else {
      this.tipoMensajeTurno = 'exito';
      this.mensajeTurno = '✅ Turno registrado con éxito.';
      this.vaciarFormulario();
    }
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
  generarProximosDias() 
  {
    const hoy = new Date();
    const diasEspecialista = this.horarioEspecialista.map(h => h.dia_semana.toLowerCase());
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  
    this.proximosDias = [];
  
    let i = 0;
    while (this.proximosDias.length < 15 && i < 30) { // límite de búsqueda para evitar bucles infinitos
      const nuevoDia = new Date(hoy);
      nuevoDia.setDate(hoy.getDate() + i);
  
      const nombreDia = diasSemana[nuevoDia.getDay()];
      if (diasEspecialista.includes(nombreDia)) {
        this.proximosDias.push(nuevoDia);
        console.log(nuevoDia);
        
      }  
      i++;
    }
    console.log('Proximos días: ', this.proximosDias);
    
  }  
  
  async seleccionarFecha(fecha: Date) {
    this.fechaSeleccionada = fecha;
    await this.cargarTurnosDelEspecialista();
  }
  esDiaCoincidente(dia: string, fecha: Date): boolean {
    const nombreDia = this.diasSemana[fecha.getDay()];
    return dia.toLowerCase() === nombreDia;
  }  
  async onCambiarEspecialista(): Promise<void> {
    await this.cargarHorariosDelEspecialista();
    this.generarProximosDias();
    this.fechaSeleccionada = null;
  }
  obtenerHorariosParaFechaSeleccionada(): HorarioEspecialista[] {
    if (!this.fechaSeleccionada) return [];
  
    const diaSeleccionado = this.diasSemana[this.fechaSeleccionada.getDay()].toLowerCase();
    return this.horarioEspecialista.filter(h => h.dia_semana.toLowerCase() === diaSeleccionado);
  } 
  vaciarFormulario(): void 
  {
    this.especialidadSeleccionada = null;
    this.especialistaSeleccionado = null;
    this.pacienteSeleccionado = null;
    this.fechaSeleccionada = null;
    this.proximosDias = [];
  }
  esBloquePasado(hora: string): boolean {
    if (!this.fechaSeleccionada) return false;
  
    const ahora = new Date();
    const fechaTurno = new Date(this.fechaSeleccionada);
  
    // Si no es el día actual, no se bloquea nada
    if (fechaTurno.toDateString() !== ahora.toDateString()) return false;
  
    const [h, m] = hora.split(':').map(Number);
    fechaTurno.setHours(h, m, 0);
  
    return fechaTurno.getTime() < ahora.getTime();
  } 
  seleccionarEspecialidad(especialidad: Especialidades): void {
    this.especialidadSeleccionada = especialidad;
    this.onSelect(); // Llama a la función que carga especialistas, si aplica
  }
  obtenerUrlImagen(especialidad: Especialidades): string {
    if (!especialidad.imagen_perfil || especialidad.imagen_perfil === 'default') {
      return 'https://lzvrwsqlfgdedhxagipk.supabase.co/storage/v1/object/public/imagenespecialidades/default.jpg';
    }
    return especialidad.imagen_perfil;
  }  
  async seleccionarEspecialista(especialista: Especialista) {
    this.especialistaSeleccionado = especialista;
    this.fechaSeleccionada = null;
  
    await this.cargarHorariosDelEspecialista(); // Cargás los horarios
    this.generarProximosDias(); // Calculás las fechas
  
    this.turnosPorFecha = {}; // Limpiás los turnos anteriores si cambiás de especialista
  
    // 🔄 Cargás todos los turnos por cada fecha
    await Promise.all(
      this.proximosDias.map(dia => this.cargarTurnosDelEspecialistaPorFecha(dia))
    );
  }
  obtenerHorariosParaDia(fecha: Date): HorarioEspecialista[] {
    const diaSemana = this.diasSemana[fecha.getDay()].toLowerCase(); // ['domingo', 'lunes', ...]
    return this.horarioEspecialista.filter(h => h.dia_semana.toLowerCase() === diaSemana);
  }
  formatearTurnoCompleto(fecha: Date, hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const f = new Date(fecha);
    f.setHours(h, m, 0);
  
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const horaFormateada = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  
    return `${dia}/${mes} ${horaFormateada}`;
  }
  async onSolicitarTurnoDesdeLista(dia: string, hora: string, fecha: Date): Promise<void> {
    this.fechaSeleccionada = fecha;
  
    const fechaStr = fecha.toISOString().split('T')[0];
    delete this.turnosPorFecha[fechaStr]; // borrás el cache viejo por si se reutiliza
  
    await this.onSolicitarTurno(dia, hora);
    await this.cargarTurnosDelEspecialistaPorFecha(fecha); // recargás para deshabilitar visualmente
  }
  
  turnosPorFecha: { [fecha: string]: Turno[] } = {};

  async cargarTurnosDelEspecialistaPorFecha(fecha: Date): Promise<void> {
    if (!this.especialistaSeleccionado) return;
  
    const fechaStr = fecha.toISOString().split('T')[0];
  
    const { data, error } = await supabase
      .from('turnos')
      .select('id, fecha, hora, estado, id_paciente, id_especialista, especialidad_id')
      .eq('id_especialista', this.especialistaSeleccionado.id)
      .eq('fecha', fechaStr);
      
    if (error) {
      console.error(`Error al cargar turnos para ${fechaStr}:`, error.message);
      this.turnosPorFecha[fechaStr] = [];
      return;
    }
  
    this.turnosPorFecha[fechaStr] = data || [];
    
  }  
  
  bloqueOcupadoEnFecha(hora: string, fecha: Date): boolean {
    const fechaStr = fecha.toISOString().split('T')[0];
    const turnos = this.turnosPorFecha[fechaStr] || [];
  
    return turnos.some(t =>
      t.hora?.substring(0, 5) === hora && // comparás "13:00" con "13:00"
      (t.estado === 'pendiente' || t.estado === 'aceptado')
    );
  }
  

  esBloquePasadoEnFecha(hora: string, fecha: Date): boolean {
    const ahora = new Date();
    const f = new Date(fecha);
    const [h, m] = hora.split(':').map(Number);
    f.setHours(h, m, 0);
    return f < ahora;
  }
  
}