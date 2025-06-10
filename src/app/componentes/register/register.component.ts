import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Paciente } from '../../modelos/interface';
import { Especialista } from '../../modelos/interface';
import { Administrador } from '../../modelos/interface';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent 
{
  formularioRegistro!:FormGroup;  
  avatarFile!: File;
  avatarFile2!: File;

  message = '';
  messageType: 'success' | 'error' = 'success';
  errorMessage = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void 
  {
    this.formularioRegistro = new FormGroup
    ({
        nombre: new FormControl("", [Validators.required, Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$'), Validators.required]),
        apellido: new FormControl("", [Validators.required, Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$'), Validators.required]),
        dni: new FormControl ("", [Validators.required, Validators.pattern(/^\d{7,8}$/)]),
        edad: new FormControl("", [Validators.required, Validators.min(18), Validators.max(99)]),
        mail: new FormControl("", [Validators.required, Validators.email]),
        password: new FormControl("", [Validators.required, Validators.minLength(6)]),
        tipo: new FormControl("", [Validators.required]),
        obra_social: new FormControl("", [Validators.required]),
        especialidad: new FormControl("", [Validators.required]),
        fotoPerfil: new FormControl("", [Validators.required])
    });    
  }

  async register() 
  {
    this.errorMessage = '';
    this.message = '';  

    try 
    {
      const { data, error } = await supabase.auth.signUp(
      {
        email: this.formularioRegistro.get('mail')?.value,
        password: this.formularioRegistro.get('password')?.value,
      });

      if (error || !data?.user) 
      {
        this.errorMessage = this.getErrorMessage(error?.message || 'Error');
        return;
      }

      const userId = data.user.id;

      console.log("mi avatar file es: ", this.avatarFile);      
      const imagenUrl = await this.subirFoto(this.avatarFile, "avatars", userId);
      console.log("mi imagen url es: ", imagenUrl);

      const usuarioData: any = 
      {
        id: userId,
        nombre: this.formularioRegistro.get('nombre')?.value,
        apellido: this.formularioRegistro.get('apellido')?.value,
        edad: this.formularioRegistro.get('edad')?.value,
        dni: this.formularioRegistro.get('dni')?.value,
        mail: this.formularioRegistro.get('mail')?.value,
        contraseña: this.formularioRegistro.get('password')?.value,
        imagen_perfil: imagenUrl,
      };

      if (this.formularioRegistro.get('tipo')?.value === 'paciente') 
      {
        usuarioData.obra_social = this.formularioRegistro.get('obra_social')?.value;
        const imagenUrl = await this.subirFoto(this.avatarFile2, "avatars", userId);
        usuarioData.imagen_perfil_2 = imagenUrl;
      }
      else if (this.formularioRegistro.get('tipo')?.value === 'especialista') 
      {
        usuarioData.especialidad = this.formularioRegistro.get('especialidad')?.value;
      }      

      let tabla = this.formularioRegistro.get('tipo')?.value;      
      
      tabla = this.formularioRegistro.get('tipo')?.value + 's';      
      
      console.log(usuarioData);

      const { error: insertError } = await supabase
        .from(tabla)
        .insert([usuarioData]);

      if (insertError) 
      {
        await supabase.auth.admin.deleteUser(userId);
        this.errorMessage = 'Error al guardar datos del usuario';
        return;
      }

      this.message = 'Registro exitoso. ¡Bienvenido!';
      this.messageType = 'success';
    } 
    catch (err) 
    {
      this.errorMessage = 'Ocurrió un error inesperado al registrar';
    }
  }

  onFileSelected(event: any, tipoArchivo: 'avatarFile' | 'avatarFile2') 
  {
    const file = event.target.files[0];
    if (file) 
    {
      this[tipoArchivo] = file;
      console.log(`Foto seleccionada (${tipoArchivo}):`, this[tipoArchivo]);
    }

  }
  async subirFoto(file: File, bucketName: string, userId: string): Promise<string> 
  {
    const { data, error } = await supabase.storage.from(bucketName).upload(
      `${userId}/${file.name}`, file,
      { upsert: false }
    );
  
    if (error) 
    {
      throw error;
    }
  
    console.log("Archivo subido:", data);
  
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(`${userId}/${file.name}`);
    console.log("URL pública generada:", urlData);
    console.log(urlData.publicUrl);   
  
    return urlData.publicUrl;
  }
  

  private getErrorMessage(rawMsg: string): string {
    const messages: Record<string, string> = {
      'Password should be at least 6 characters.': 'La contraseña debe tener al menos 6 caracteres',
      'Signup requires a valid password': 'Ingrese una contraseña válida',
      'Anonymous sign-ins are disabled': 'Ingrese un usuario y contraseña válidos',
      'User already registered': 'El usuario ya está registrado',
    };
    return messages[rawMsg] || `Error inesperado: ${rawMsg}`;
  }
}
