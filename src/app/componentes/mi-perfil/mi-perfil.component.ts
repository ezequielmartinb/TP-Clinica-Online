import { Component } from '@angular/core';
import { Especialista, Paciente } from '../../modelos/interface';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EspecialidadPipe } from "../../pipes/especialidad.pipe";
import { DniPipe } from "../../pipes/dni.pipe";
import * as moment from 'moment-timezone';
import { validarFranjaHoraria } from '../validadores/tiempo.validator';


const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-mi-perfil',
  imports: [FormsModule, CommonModule, EspecialidadPipe, DniPipe, ReactiveFormsModule],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.css'
})
export class MiPerfilComponent {
  paciente: Paciente | null = null;
  especialista: Especialista | null = null;
  mail: string | null = '';
  rol: string | null = '';
  horarios: { dia: string; horaInicio: string; horaFin: string }[] = [];
  horarioForm!: FormGroup;
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  especialistaId!: string;
  mostrarFormulario = false;
  isLoading:boolean = false;

  constructor(private fb: FormBuilder)
  {
    
  }
  async ngOnInit() 
  {
    this.isLoading = true;
    this.rol = localStorage.getItem('rol');
    this.mail = localStorage.getItem('mail');
    this.horarioForm = this.fb.group({
      diaSemana: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required]
    }, { validators: validarFranjaHoraria() });
    

    console.log("mail: " + this.mail);    

    if (this.mail) {
      const rol = localStorage.getItem('rol');
      const tabla = rol === 'paciente' ? 'pacientes' : 'especialistas';

      const { data, error } = await supabase
        .from(tabla)
        .select('*')
        .eq('mail', this.mail)
        .single();

      if (error) 
      {
        console.error('Error obteniendo perfil:', error.message);
      }
      if(this.rol === 'paciente')
      {
        this.paciente = (data as Paciente);
      }
      else
      {
        this.especialista = (data as Especialista);
        this.especialistaId = String(this.especialista.id);
      }
    }
    this.isLoading = false;
    console.log("El paciente es: " + this.paciente);    
    console.log("El especialista es: " + this.especialista);    
  }
  toggleFormulario() 
  {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  async guardarHorario() 
  {
    if (this.horarioForm.invalid) 
    {
      console.error("Formulario inválido.");
      return;
    }

    const horario = 
    {
      especialista_id: this.especialistaId,
      dia_semana: this.horarioForm.value.diaSemana,
      hora_inicio: moment.tz(this.horarioForm.value.horaInicio, "HH:mm", "America/Argentina/Buenos_Aires").format("HH:mm"),
      hora_fin: moment.tz(this.horarioForm.value.horaFin, "HH:mm", "America/Argentina/Buenos_Aires").format("HH:mm")
    };

    const { error } = await supabase
      .from('horarios_especialistas')
      .insert([horario]);

    if (error) 
    {
      console.error("Error al guardar el horario:", error.message);
    } 
    else 
    {
      console.log("Horario guardado correctamente.");
      this.horarioForm.reset();
      this.mostrarFormulario = false; // Oculta el formulario después de guardar
    }
  }

  
}
