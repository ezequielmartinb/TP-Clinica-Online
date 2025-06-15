import { Component, OnInit } from '@angular/core';
import { Administrador, Especialista, Paciente, Usuario } from '../../modelos/interface';
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
  cargando: boolean = true; // Nueva variable para el estado de carga
  filtro: string = '';
  campoSeleccionado: string = 'nombre'; // valor por defecto
  camposDisponibles: { clave: string; etiqueta: string }[] = [
    { clave: 'nombre', etiqueta: 'Nombre' },
    { clave: 'apellido', etiqueta: 'Apellido' },
    { clave: 'mail', etiqueta: 'Mail' },
    { clave: 'dni', etiqueta: 'DNI' },
  ];  
  constructor(private router: Router) {}

  async ngOnInit() {
    this.usuarios = await this.obtenerUsuarios();
    this.cargando = false;    
  }

  async obtenerUsuarios(): Promise<Usuario[]> 
  {
    const { data: pacientes, error: errorPacientes } = await supabase.from('pacientes').select('*');
    const { data: especialistas, error: errorEspecialistas } = await supabase.from('especialistas').select('*');
    const { data: administradores, error: errorAdministradores } = await supabase.from('administradores').select('*');
  
    if (errorPacientes || errorEspecialistas || errorAdministradores) {
      console.error('Error obteniendo datos:', errorPacientes || errorEspecialistas || errorAdministradores);
      return [];
    }
  
    return [
      ...pacientes.map(paciente => ({ ...paciente})),
      ...especialistas.map(especialista => ({ ...especialista })),
      ...administradores.map(admin => ({ ...admin }))
    ];
  }
  obtenerTipoClase(usuario: any): 'paciente' | 'especialista' | 'administrador' | 'Desconocido' 
  {
    if ('obra_social' in usuario) return 'paciente';
    if ('especialidad' in usuario) return 'especialista';
    if ('es_admin' in usuario || usuario.rol === 'admin') return 'administrador';
    return 'Desconocido';
  }
  obtenerTablaPorTipo(usuario: any): string 
  {
    if (usuario.obra_social) return 'pacientes';
    if (usuario.especialidad) return 'especialistas';
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

}
