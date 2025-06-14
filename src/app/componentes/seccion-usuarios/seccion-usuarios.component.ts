import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../modelos/interface';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-seccion-usuarios',
  imports: [FormsModule, CommonModule],
  templateUrl: './seccion-usuarios.component.html',
  styleUrl: './seccion-usuarios.component.css'
})

export class SeccionUsuariosComponent implements OnInit
{
  usuarios: Usuario[] = [];
  cargando: boolean = true; // Nueva variable para el estado de carga

  async ngOnInit() {
    this.usuarios = await this.obtenerUsuarios();
    this.cargando = false;
  }

  async obtenerUsuarios(): Promise<Usuario[]> {
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
}
