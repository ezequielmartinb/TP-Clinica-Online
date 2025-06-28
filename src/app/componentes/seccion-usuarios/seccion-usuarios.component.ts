import { Component, OnInit } from '@angular/core';
import { Administrador, EspecialidadDeEspecialista, Especialidades, Especialista, HistoriaClinica, Paciente, Usuario } from '../../modelos/interface';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DirectivaZoomFotosDirective } from '../../directivas/directiva-zoom-fotos.directive';
import { DirectivaColorRolDirective } from '../../directivas/directiva-color-rol.directive';
import { DniPipe } from '../../pipes/dni.pipe';
import { FiltroPipe } from '../../pipes/filtro.pipe';
import { OrdenarPipe } from '../../pipes/ordenar.pipe';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';


const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-seccion-usuarios',
  imports: [FormsModule, CommonModule, DirectivaZoomFotosDirective, DirectivaColorRolDirective, DniPipe, FiltroPipe, OrdenarPipe],
  templateUrl: './seccion-usuarios.component.html',
  styleUrl: './seccion-usuarios.component.css'
})

export class SeccionUsuariosComponent implements OnInit
{
  usuarios: Usuario[] = [];
  especialidadesDeEspecialistas: EspecialidadDeEspecialista[] = []
  cargando: boolean = true; // Nueva variable para el estado de carga
  filtro: string = '';
  campoSeleccionado: string = 'nombre'; // valor por defecto
  camposDisponibles: { clave: string; etiqueta: string }[] = [
    { clave: 'nombre', etiqueta: 'Nombre' },
    { clave: 'apellido', etiqueta: 'Apellido' },
    { clave: 'mail', etiqueta: 'Mail' },
    { clave: 'dni', etiqueta: 'DNI' },
  ];  
  historiasPorPaciente: HistoriaClinica[] = [];
  mostrarHistorias: boolean = false;
  pacienteActivoId: string | null = null;
  especialidades: Especialidades[] = [];
  asignaciones: EspecialidadDeEspecialista[] = [];

  
  constructor(private router: Router) {}

  async ngOnInit() 
  {
    this.usuarios = await this.obtenerUsuarios();
    this.especialidadesDeEspecialistas = await this.obtenerEspecialidadesDeEspecialistas();
    this.cargando = false;    
    console.log(this.usuarios);
    this.especialidades = await this.obtenerEspecialidades(); // función que falta agregar
  this.asignaciones = this.especialidadesDeEspecialistas; // ya la estás trayendo
    
  }

  async obtenerUsuarios(): Promise<Usuario[]> 
  {
    const { data: pacientes, error: errorPacientes } = await supabase.from('pacientes').select('*');
    const { data: especialistas, error: errorEspecialistas } = await supabase.from('especialistas').select('*');
    const { data: administradores, error: errorAdministradores } = await supabase.from('administradores').select('*');
  
    if (errorPacientes || errorEspecialistas || errorAdministradores)  {
      console.error('Error obteniendo datos:', errorPacientes || errorEspecialistas || errorAdministradores);
      return [];
    }
  
    return [
      ...pacientes.map(paciente => ({ ...paciente})),
      ...especialistas.map(especialista => ({ ...especialista })),
      ...administradores.map(admin => ({ ...admin })),
    ];
  }
  async obtenerEspecialidadesDeEspecialistas(): Promise<EspecialidadDeEspecialista[]> 
  {
    const { data: especialidades_de_especialistas, error: errorespecialidades_de_especialistas } = await supabase.from('especialidades_de_especialistas').select('*');
    if ( errorespecialidades_de_especialistas) {
      console.error('Error obteniendo datos:', errorespecialidades_de_especialistas);
      return [];
    }
    return [      
      ...especialidades_de_especialistas.map(especialidades_de_especialistas => ({ ...especialidades_de_especialistas }))
    ];
  }
  async obtenerEspecialidades(): Promise<Especialidades[]> {
    const { data, error } = await supabase.from('especialidades').select('*');
    if (error) {
      console.error('Error al obtener especialidades:', error);
      return [];
    }
    return data ?? [];
  }
  
  obtenerTipoClase(usuario: Usuario): 'paciente' | 'especialista' | 'administrador' {
    if ('obra_social' in usuario) return 'paciente';
    if (this.esUsuarioEspecialista(usuario.id)) return 'especialista';
    return 'administrador';
  }
  obtenerTablaPorTipo(usuario: any): string 
  {
    if (usuario.obra_social) return 'pacientes';
    if (this.esUsuarioEspecialista(usuario.id)) return 'especialistas';
    return 'administradores';
  }
  
  async habilitarUsuario(usuario:Paciente | Especialista | Administrador)
  {
    try 
    {
      console.log(`✅ Cambiando estado de aprobación para ${usuario.mail}...`);
  
      const nuevoEstado = !usuario.aprobado;      
      const tabla = this.obtenerTablaPorTipo(usuario);
      console.log(tabla);      
  
      const { error } = await supabase
        .from(tabla)
        .update({ aprobado: nuevoEstado })
        .eq('id', usuario.id);
  
      if (error) throw error;
  
      console.log(`✅ Estado actualizado correctamente para ${usuario.mail}`);
      usuario.aprobado = nuevoEstado;
    } 
    catch (err) 
    {
      console.error("⚠ Error al actualizar estado de usuario:", err);
    }  
  }
  irRegistro()
  {
    this.router.navigate(['registro']);
  }  
  esUsuarioEspecialista(idUsuario: string): boolean {
    return this.especialidadesDeEspecialistas.some(e => e.id_especialista === idUsuario);
  }
  
  exportarExcel(): void {
    type UsuarioExportable = Usuario & {
      especialidad?: string;
    };
    const usuariosEnriquecidos: UsuarioExportable[] = this.usuarios.map(u => {
      const tipo = this.obtenerTipoClase(u);
  
      if (tipo === 'especialista') {
        const asignaciones = this.asignaciones.filter(a => a.id_especialista === u.id);
        const nombresEspecialidades = asignaciones
          .map(a => this.especialidades.find(e => e.id === a.id_especialidad)?.nombre)
          .filter((nombre): nombre is string => !!nombre);
  
        return {
          ...u,
          especialidad: nombresEspecialidades.length ? nombresEspecialidades.join(', ') : '—'
        };
      }
  
      return u; // Paciente o Administrador
    });
  
    const usuariosExportar = usuariosEnriquecidos.map(u => {
      const tipo = this.obtenerTipoClase(u);
      const base = {
        Apellido: u.apellido,
        Nombre: u.nombre,
        Edad: u.edad,
        DNI: u.dni,
        Email: u.mail,
        Tipo: tipo
      };
  
      if (tipo === 'paciente') {
        const paciente = u as Paciente;
        return { ...base, 'Obra Social': paciente.obra_social ?? '—' };
      } else if (tipo === 'especialista') {
        return { ...base, Especialidades: u.especialidad ?? '—' };
      }
  
      return base;
    });
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(usuariosExportar);
    const workbook: XLSX.WorkBook = {
      Sheets: { Usuarios: worksheet },
      SheetNames: ['Usuarios']
    };
  
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'listado_usuarios.xlsx');
  }
  async verHistoriaClinicaPorPaciente(pacienteId: string) {
    // Si ya está activo → cerrar
    if (this.pacienteActivoId === pacienteId) {
      this.pacienteActivoId = null
      this.mostrarHistorias = false
      this.historiasPorPaciente = []
      return
    }
  
    // Nuevo paciente seleccionado → cargar historias
    this.pacienteActivoId = pacienteId
    this.mostrarHistorias = true
  
    try {
      const { data: turnos, error: errorTurnos } = await supabase
        .from('turnos')
        .select('id')
        .eq('id_paciente', pacienteId)
  
      if (errorTurnos || !turnos?.length) {
        console.warn('No se encontraron turnos para el paciente:', pacienteId)
        this.historiasPorPaciente = []
        return
      }
  
      const idsTurno = turnos.map(t => t.id)
  
      const { data: historias, error: errorHistorias } = await supabase
        .from('historia_clinica')
        .select('*')
        .in('id_turno', idsTurno)
  
      if (errorHistorias) {
        console.error('Error al obtener historias clínicas:', errorHistorias)
        return
      }
  
      this.historiasPorPaciente = historias || []
    } catch (error) {
      console.error('Error al obtener historia clínica del paciente:', error)
      this.historiasPorPaciente = []
    }
  }
  cerrarHistoria() {
    this.pacienteActivoId = null
    this.mostrarHistorias = false
    this.historiasPorPaciente = []
  }
  async exportarTurnosDelUsuario(usuario: Usuario): Promise<void> {
    try {
      const tipo = this.obtenerTipoClase(usuario);
  
      if (tipo !== 'paciente') {
        console.warn('Solo se exportan turnos de pacientes.');
        return;
      }
  
      // Buscar los turnos
      const { data: turnos, error } = await supabase
        .from('turnos')
        .select(`fecha, hora, estado, id_especialista, especialidad_id`)
        .eq('id_paciente', usuario.id);
  
      if (error || !turnos?.length) {
        console.warn('No se encontraron turnos.');
        return;
      }
  
      // Traer también especialistas y especialidades
      const { data: especialistas } = await supabase.from('especialistas').select(`id, nombre, apellido`);
      const { data: especialidades } = await supabase.from('especialidades').select(`id, nombre`);
  
      const dataExportar = turnos.map(turno => {
        const especialista = especialistas?.find(e => e.id === turno.id_especialista);
        const especialidad = especialidades?.find(e => e.id === turno.especialidad_id);
        return {
          Fecha: turno.fecha,
          Hora: turno.hora,
          Estado: turno.estado,
          Especialidad: especialidad?.nombre ?? '—',
          Profesional: especialista
            ? `${especialista.apellido}, ${especialista.nombre}`
            : '—'
        };
      });
      console.log(dataExportar);
      
  
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataExportar);
      const workbook: XLSX.WorkBook = {
        Sheets: { Turnos: worksheet },
        SheetNames: ['Turnos']
      };
  
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, `turnos_${usuario.apellido}_${usuario.nombre}.xlsx`);
    } catch (err) {
      console.error('❌ Error al exportar turnos:', err);
    }
  }
  
}
