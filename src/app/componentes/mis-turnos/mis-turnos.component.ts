import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Especialidades, Especialista, Paciente, Turno } from '../../modelos/interface';
import { FiltroEspecialidadPipe } from "../../pipes/filtro-especialidad.pipe";
import { FiltroEspecialistaPipe } from "../../pipes/filtro-especialista.pipe";
import { FiltroPacientePipe } from "../../pipes/filtro-paciente.pipe";
import { MiEncuestaComponent } from "../mi-encuesta/mi-encuesta.component";
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { HistoriaClinicaComponent } from "../historia-clinica/historia-clinica.component";
import { FiltroDatoExtraPipe } from "../../pipes/filtro-dato-extra.pipe";

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-mis-turnos',
  imports: [CommonModule, FormsModule, FiltroEspecialidadPipe, FiltroEspecialistaPipe, FiltroPacientePipe, MatDialogModule, HistoriaClinicaComponent, FiltroDatoExtraPipe],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent implements OnInit
{
  @ViewChild('modalAccion') modalAccion!: TemplateRef<any>;
  @ViewChild('modalCalificacion') modalCalificacion!: TemplateRef<any>;
  @ViewChild('modalHistoria') modalHistoria!: TemplateRef<any>;
  
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
  filtroDatoExtra: string = '';
  resenaActivaId: string | null = null;
  isLoading:boolean = true;
  motivoActivoId: string | null = null;
  tipoMotivoActivo: string | null = null;
  textoMotivo: string = '';
  rolMotivoUsuario: 'paciente' | 'especialista' | null = null;
  puntuacionSeleccionada: number = 0;
  comentarioEncuesta: string = '';
  turnosCalificados = new Set<string>(); // guarda los id_turno ya calificados
  turnosEncuestados = new Set<string>(); // guarda los id_turno ya encuestados
  dialogRef: MatDialogRef<any> | null = null;
  turnoSeleccionado!: Turno;
  accionSeleccionada!: 'cancelar' | 'rechazar' | 'finalizar';
  mostrarModalHistoria: boolean = false;
  historiaClinicaPorTurno = new Set<string>();
  historiaSeleccionada: any = null;
  historiaActivaId: string | null = null;
  historiaClinicaMap = new Map<string, any>();


  constructor(private dialog: MatDialog) {}
  
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
    await this.cargarHistoriasClinicasAsociadas();
    await this.cargarEspecialidades();
    await this.cargarEspecialistas();
    await this.cargarEncuestas();
    await this.cargarCalificaciones();
    await this.cargarHistoriasClinicasMap();
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
  async cargarEncuestas() {
    const { data, error } = await supabase
      .from('encuestas')
      .select('id_turno');
  
    if (!error && data) {
      data.forEach(item => this.turnosEncuestados.add(item.id_turno));
    }
  }
  async cargarHistoriasClinicasAsociadas() {
    const { data: historias, error } = await supabase
      .from('historia_clinica')
      .select('id_turno');
  
    if (error) {
      console.error('Error al obtener historias clínicas:', error);
      return;
    }
  
    this.historiaClinicaPorTurno = new Set(historias.map(h => h.id_turno)); 
  }  
  async cargarHistoriasClinicasMap() {
    const { data: historias, error } = await supabase
      .from('historia_clinica')
      .select('*');
  
    if (error) {
      console.error('Error al obtener historias clínicas:', error);
      return;
    }    
    this.historiaClinicaMap.clear();
    historias.forEach(historia => {
      this.historiaClinicaMap.set(historia.id_turno, historia);
    });
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
  getTurnoById(id: string | null): Turno | null {
    return this.turnos.find(t => t.id === id) ?? null;
  }
  abrirEncuestaModal(turno: Turno) {
    const dialogRef = this.dialog.open(MiEncuestaComponent, {
      width: '500px',
      data: { turno }  // esto llega como @Inject(MAT_DIALOG_DATA) en el componente
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result?.id_turno) {
        this.turnosEncuestados.add(result.id_turno);
      }
    });  
  }  

  abrirFormulario(turnoId: string, accion: 'cancelar' | 'encuesta' | 'calificacion' | 'rechazar' | 'finalizar')
  {
    this.formularioActivoId = turnoId;
    this.accionFormulario = accion;
    this.comentario = '';
    this.comentarioEncuesta = '';
    console.log('id turno seleccionado: ', turnoId);    
  }

  cerrarFormulario() 
  {
    this.formularioActivoId = null;
    this.accionFormulario = null;
    this.comentario = '';
  }

  async enviarFormulario(turno: Turno) {
    if (!this.comentario.trim()) return;
  
    let nuevoEstado = turno.estado;
    const accion = this.accionSeleccionada;
    console.log(accion);
    
  
    if (accion === 'cancelar') {
      nuevoEstado = 'cancelado';
    } else if (accion === 'rechazar') {
      nuevoEstado = 'rechazado';
    } 
    else if (accion === 'finalizar') {
      nuevoEstado = 'finalizado';
      this.turnoSeleccionado = turno;
      this.mostrarModalHistoria = true;
      this.dialogRef?.close();
    }
  
    // Actualiza el estado del turno (y la reseña solo si se finaliza)
    const { error } = await supabase
      .from('turnos')
      .update({
        estado: nuevoEstado,
        ...(accion === 'finalizar' && { resena: this.comentario })
      })
      .eq('id', turno.id);
  
    if (!error) {
      turno.estado = nuevoEstado;
      if (accion === 'finalizar') {
        turno.resena = this.comentario;
      }
  
      if (accion === 'cancelar' || accion === 'rechazar') {
        // Guarda el motivo en tabla separada
        const fechaArgentina = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
        await supabase.from('turnos_cancelados').insert({
          id_turno: turno.id,
          motivo: this.comentario,
          accion: accion,
          rol_usuario: this.rolUsuario,
          fecha_registro: fechaArgentina
        });
      }
    }
    this.cerrarFormulario();
  }  
  abrirModalAccion(turno: Turno, accion: 'cancelar' | 'rechazar' | 'finalizar') {
    this.turnoSeleccionado = turno;
    this.accionSeleccionada = accion;
    this.comentario = '';
  
    this.dialogRef = this.dialog.open(this.modalAccion, {
      width: '400px',
      data: { accion }
    });
  }
  abrirCalificacionModal(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.puntuacionSeleccionada = 0;
    this.dialogRef = this.dialog.open(this.modalCalificacion, {
      width: '400px'
    });
  }
  async finalizarTurnoConHistoriaClinica(turno: Turno) {
    const { error } = await supabase
      .from('turnos')
      .update({ estado: 'finalizado' })
      .eq('id', turno.id);
  
    if (!error) {
      turno.estado = 'finalizado';
      console.log('Turno finalizado con éxito junto con historia clínica');
  
      this.historiaClinicaPorTurno.add(turno.id);
  
      // 🔄 Refrescar visualmente la fila del turno
      const idx = this.turnos.findIndex(t => t.id === turno.id);
      if (idx !== -1) {
        this.turnos[idx] = { ...this.turnos[idx] };
      }
    } else {
      console.error('Error al finalizar el turno:', error.message);
    }
  
    this.mostrarModalHistoria = false;
    this.dialogRef?.close();
    this.cerrarFormulario();
  }
  async verHistoriaClinica(turno: Turno) {
    if (this.historiaActivaId === turno.id) {
      this.cerrarHistoria();
      return;
    }
  
    const { data, error } = await supabase
      .from('historia_clinica')
      .select('*')
      .eq('id_turno', turno.id)
      .maybeSingle();
  
    if (error) {
      console.error('Error al obtener historia clínica:', error.message);
      return;
    }
  
    this.historiaSeleccionada = data;
    this.historiaActivaId = turno.id;
  }
  
  cerrarHistoria() {
    this.historiaActivaId = null;
    this.historiaSeleccionada = null;
  }
  
  

  async abrirModalHistoria(turno: Turno) {
    const { data, error } = await supabase
    .from('historia_clinica')
    .select('id')
    .eq('id_turno', turno.id)
    .maybeSingle();

    if (data) 
    {
      alert('Ya se ha cargado una historia clínica para este turno.');
      return;
    }

    this.turnoSeleccionado = turno;
    this.comentario = '';
    this.dialogRef = this.dialog.open(this.modalHistoria, {
      width: '400px'
    });
  }
  
  
  async confirmarAccion() 
  {
    await this.enviarFormulario(this.turnoSeleccionado);
    this.dialogRef?.close();
  }
  
  verResena(turno: Turno) {
    this.resenaActivaId = this.resenaActivaId === turno.id ? null : turno.id;
  }  
  async verMotivoCancelacion(turno: Turno) {
    if (this.motivoActivoId === turno.id) {
      this.cerrarMotivoCancelacion();
      return;
    }
  
    const { data, error } = await supabase
      .from('turnos_cancelados')
      .select('motivo, accion, rol_usuario')
      .eq('id_turno', turno.id)
      .single();
  
    if (!error && data) {
      this.motivoActivoId = turno.id;
      this.textoMotivo = data.motivo;
      this.tipoMotivoActivo = data.accion;
      this.rolMotivoUsuario = data.rol_usuario;
    }
  }
  cerrarMotivoCancelacion() {
    this.motivoActivoId = null;
    this.textoMotivo = '';
    this.tipoMotivoActivo = null;
  }  
  
  accionesPermitidas(turno: Turno) {
    if (this.rolUsuario === 'paciente') {
      return {
        puedeCancelar: turno.estado === 'pendiente' || turno.estado === 'aceptado',
        puedeEncuestar: turno.estado === 'finalizado' && !!turno.resena,
        puedeCalificar: turno.estado === 'finalizado',
        puedeVerResena: !!turno.resena
      };
    } else {
      return {
        puedeCancelar: !['aceptado', 'finalizado', 'rechazado', 'cancelado'].includes(turno.estado),
        puedeRechazar: !['aceptado', 'finalizado', 'cancelado', 'rechazado'].includes(turno.estado),
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
  async enviarCalificacion(turno: Turno) 
  {
    if (!this.usuarioId || !this.puntuacionSeleccionada) return;
    const fechaArgentina = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
    
    const { error } = await supabase.from('calificacion').insert({
      id_turno: turno.id,
      puntuacion: this.puntuacionSeleccionada,
      fecha_respuesta: fechaArgentina
    });
  
    if (!error) 
    {
      this.puntuacionSeleccionada = 0;
      this.turnosCalificados.add(turno.id);
      console.log('✅ Calificacion registrada');
      this.dialogRef?.close();
    } 
    else 
    {
      console.error('❌ Error al registrar calificacion:', error.message);
    }
  }
  async cargarCalificaciones() {
    const { data, error } = await supabase
      .from('calificacion')
      .select('id_turno');
  
    if (!error && data) {
      data.forEach(registro => {
        this.turnosCalificados.add(registro.id_turno);
      });
    }
  }    
}