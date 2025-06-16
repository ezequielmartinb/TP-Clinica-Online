import { Component, OnInit } from '@angular/core';
import { Especialista, Paciente } from '../../modelos/interface';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-solicitar-turnos',
  imports: [],
  templateUrl: './solicitar-turnos.component.html',
  styleUrl: './solicitar-turnos.component.css'
})
export class SolicitarTurnosComponent
{
  
}