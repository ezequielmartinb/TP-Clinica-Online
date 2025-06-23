import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HistoriaClinica, Turno } from '../../modelos/interface';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-historia-clinica',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})


export class HistoriaClinicaComponent implements OnInit
{  
  @Input() turno!: Turno;
  @Input() comentario: string = '';
  @Output() onHistoriaGuardada = new EventEmitter<Turno>();
  historiaClinicaForm!: FormGroup;


  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.historiaClinicaForm = this.fb.group({
      altura: ['', [Validators.required, Validators.min(1.0), Validators.max(2.5)]],
      peso: ['', [Validators.required, Validators.min(30), Validators.max(250)]],
      temperatura: ['', [Validators.required, Validators.min(34), Validators.max(43)]],
      presion: ['', [
        Validators.required,
        Validators.pattern(/^\d{2,3}\/\d{2,3}$/)
      ]],
      datosExtra: this.fb.array([])
    });
  }

  get datosExtra(): FormArray {
    return this.historiaClinicaForm.get('datosExtra') as FormArray;
  }

  agregarDatoExtra(): void {
    if (this.datosExtra.length < 3) {
      const nuevoDato = this.fb.group({
        clave: ['', Validators.required],
        valor: ['', Validators.required]
      });
      this.datosExtra.push(nuevoDato);
    }
  }

  eliminarDatoExtra(index: number): void {
    this.datosExtra.removeAt(index);
  }

  async onSubmit(): Promise<void> {
    if (this.historiaClinicaForm.valid) {
      const datos = this.historiaClinicaForm.value;
      const fechaArgentina = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });   
      console.log(datos.datos_extra);
      
      const { error } = await supabase
        .from('historia_clinica')
        .insert({
          id_turno: this.turno.id, // esto lo tenés que pasar al componente
          fecha: fechaArgentina,
          altura: datos.altura,
          peso: datos.peso,
          temperatura: datos.temperatura,
          presion: datos.presion,
          datos_extra: datos.datosExtra
        });

      if (error) {
        console.error('Error al guardar historia clínica:', error);
      } 
      console.log('Historia clínica guardada con éxito');
      this.onHistoriaGuardada.emit(this.turno);
    }

  }

}