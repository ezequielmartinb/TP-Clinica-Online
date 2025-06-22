import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { Encuesta, Turno } from '../../modelos/interface';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelect, MatSelectModule } from '@angular/material/select';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-mi-encuesta',
  imports: [FormsModule, CommonModule, MatDialogModule, MatSelectModule],
  templateUrl: './mi-encuesta.component.html',
  styleUrl: './mi-encuesta.component.css'
})
export class MiEncuestaComponent 
{
  @Output() cerrarEncuesta = new EventEmitter<void>();  
  encuestaEnviada = false;

  respuesta: Encuesta = 
  {
    atencion: '',
    instalaciones: '',
  };
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: { turno: Turno }, private dialogRef: MatDialogRef<MiEncuestaComponent>) 
  {
    console.log(this.data.turno);

  }
  
  cerrar()
  {
    if (this.encuestaEnviada) 
    {
      this.dialogRef.close({ id_turno: this.data.turno.id });
    } 
    else 
    {
      this.dialogRef.close();
    }  
  }  

  async enviarEncuesta() 
  {    
    
    if (!this.data.turno?.id || !this.respuesta.atencion) return;
    const fechaArgentina = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
  
    const { error } = await supabase.from('encuestas').insert({
      id_turno: this.data.turno.id,
      atencion: this.respuesta.atencion,
      instalaciones: this.respuesta.instalaciones,
      fecha_respuesta: fechaArgentina // o podés omitirlo si usás default
    });
      
    if (!error) 
    {
      console.log('✅ Encuesta enviada');
      this.encuestaEnviada = true;
    } 
    else 
    {
      console.error('❌ Error al enviar encuesta:', error.message);
    }
  }  
}
