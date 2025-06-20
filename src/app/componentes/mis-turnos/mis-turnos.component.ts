import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Especialidades, Especialista, Paciente, Turno } from '../../modelos/interface';
import { FiltroEspecialidadPipe } from "../../pipes/filtro-especialidad.pipe";
import { FiltroEspecialistaPipe } from "../../pipes/filtro-especialista.pipe";
import { FiltroPacientePipe } from "../../pipes/filtro-paciente.pipe";

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-mis-turnos',
  imports: [CommonModule, FormsModule, FiltroEspecialidadPipe, FiltroEspecialistaPipe, FiltroPacientePipe],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent implements OnInit
{
  rolUsuario:string = '';
  turnos: Turno[] = [];
  especialidades: Especialidades[] = [];
  especialistas: Especialista[] = [];
  pacientes: Paciente[] = [];
  usuarioId:string | null = '';
  formularioActivoId: string | null = null;
  accionFormulario: 'cancelar' | 'encuesta' | 'calificacion' | 'rechazar' | 'finalizar' | null = null;
  comentario: string = '';
  filtroEspecialistaTexto: string = '';
  filtroEspecialidadTexto: string = '';
  filtroPacienteTexto: string = '';
  resenaActivaId: string | null = null;
  isLoading:boolean = true;

  async ngOnInit() 
  {
    const rol = localStorage.getItem('rol'); // debería ser 'paciente' o 'especialista'
    this.rolUsuario = rol === 'especialista' ? 'especialista' : 'paciente';
    this.usuarioId = localStorage.getItem('id_usuario');

    this.inicializarDatos();
    
  }
  async inicializarDatos() 
  {
    await this.cargarPacientes();
    if (this.rolUsuario === 'paciente') 
    {
      await this.cargarTurnosPacientes();
    } 
    else 
    {
      await this.cargarTurnosEspecialista();
    }
    await this.cargarEspecialidades();
    await this.cargarEspecialistas();
    this.isLoading = false;
  }
  
  async cargarTurnosPacientes() 
  {
    if (!this.usuarioId) 
    {
      console.warn('ID de paciente no encontrado en localStorage');
      this.turnos = [];
      return;
    }

    const { data, error } = await supabase
      .from('turnos')
      .select(`
        id,
        id_paciente,
        id_especialista,
        especialidad_id,
        fecha,
        hora,
        estado,
        resena
      `)
      .eq('id_paciente', this.usuarioId);

    this.turnos = data ?? [];
  }
  async cargarTurnosEspecialista() {
    if (!this.usuarioId) return;
  
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        id,
        id_paciente,
        id_especialista,
        especialidad_id,
        fecha,
        hora,
        estado,
        resena
      `)
      .eq('id_especialista', this.usuarioId);
  
    this.turnos = error ? [] : data ?? [];
  }

  async cargarEspecialistas() 
  {
    const { data, error } = await supabase
      .from('especialistas')
      .select('id, nombre, apellido, edad, dni, mail, contrasena, aprobado');
    this.especialistas = error ? [] : data ?? [];
  }

  async cargarEspecialidades() 
  {
    const { data, error } = await supabase
      .from('especialidades')
      .select('id, nombre');
    this.especialidades = error ? [] : data ?? [];
  }
  async cargarPacientes() 
  {
    const { data, error } = await supabase.from('pacientes').select('*');    
    this.pacientes = error ? [] : data ?? [];
  }
  
  getNombrePaciente(id: string): string 
  {   
    const paciente = this.pacientes.find(p => p.id === id);    
    return paciente ? `${paciente.apellido}, ${paciente.nombre}` : 'Desconocido';
  }
  
  getNombreEspecialista(id: string): string 
  {
    const e = this.especialistas.find(x => x.id === id);
    return e ? `${e.apellido}, ${e.nombre}` : 'Desconocido';
  }

  getNombreEspecialidad(id: number): string 
  {
    const esp = this.especialidades.find(e => e.id === id);
    return esp ? esp.nombre : 'Desconocida';
  }
  getResenaActiva(): string | null {
    const turno = this.turnos.find(t => t.id === this.resenaActivaId);
    return turno?.resena ?? null;
  }
  

  abrirFormulario(turnoId: string, accion: 'cancelar' | 'encuesta' | 'calificacion' | 'rechazar' | 'finalizar')
  {
    this.formularioActivoId = turnoId;
    this.accionFormulario = accion;
    this.comentario = '';
    console.log('id turno seleccionado: ', turnoId);    
  }

  cerrarFormulario() 
  {
    this.formularioActivoId = null;
    this.accionFormulario = null;
    this.comentario = '';
  }

  async enviarFormulario(turno: Turno) 
  {
    if (!this.comentario.trim()) return;

    let nuevoEstado = turno.estado;

    if (this.accionFormulario === 'cancelar') {
      nuevoEstado = 'cancelado';
    } else if (this.accionFormulario === 'rechazar') {
      nuevoEstado = 'rechazado';
    } else if (this.accionFormulario === 'finalizar') {
      nuevoEstado = 'finalizado';
    }

    const { error } = await supabase
      .from('turnos')
      .update({ estado: nuevoEstado, resena: this.comentario })
      .eq('id', turno.id);

    if (!error) 
    {
      turno.estado = nuevoEstado;
      turno.resena = this.comentario;
    }

    this.cerrarFormulario();
  }

  verResena(turno: Turno) {
    this.resenaActivaId = this.resenaActivaId === turno.id ? null : turno.id;
  }  
  accionesPermitidas(turno: Turno) {
    if (this.rolUsuario === 'paciente') {
      return {
        puedeCancelar: turno.estado === 'pendiente' || turno.estado === 'aceptado',
        puedeEncuestar: turno.estado === 'finalizado' && turno.resena,
        puedeCalificar: turno.estado === 'finalizado',
        puedeVerResena: !!turno.resena
      };
    } else {
      return {
        puedeCancelar: !['aceptado', 'finalizado', 'rechazado'].includes(turno.estado),
        puedeRechazar: !['aceptado', 'finalizado', 'cancelado'].includes(turno.estado),
        puedeAceptar: !['aceptado', 'cancelado', 'rechazado', 'finalizado'].includes(turno.estado),
        puedeFinalizar: turno.estado === 'aceptado',
        puedeVerResena: !!turno.resena
      };
    }
  } 
  async aceptarTurno(turno: Turno) {
    const { error } = await supabase
      .from('turnos')
      .update({ estado: 'aceptado' })
      .eq('id', turno.id);
  
    if (!error) turno.estado = 'aceptado';
  }
  
  
}