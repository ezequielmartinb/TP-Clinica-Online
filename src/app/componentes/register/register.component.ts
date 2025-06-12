import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Paciente, Usuario } from '../../modelos/interface';
import { Especialista } from '../../modelos/interface';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit
{
  formularioRegistro!:FormGroup;  
  avatarFile: File | null = null;
  avatarFile2: File | null = null;
  especialista!: Especialista;
  paciente!: Paciente;
  message:string = '';
  messageType: 'success' | 'error' = 'success';
  errorMessage:string = '';
  isLoading:boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void 
  {
    this.formularioRegistro = new FormGroup
    ({
        nombre: new FormControl("", [Validators.required, Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$')]),
        apellido: new FormControl("", [Validators.required, Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$')]),
        dni: new FormControl ("", [Validators.required, Validators.pattern(/^\d{7,8}$/)]),
        edad: new FormControl("", [Validators.required, Validators.min(18), Validators.max(99)]),
        mail: new FormControl("", [Validators.required, Validators.email]),
        password: new FormControl("", [Validators.required, Validators.minLength(6)]),
        tipo: new FormControl("", [Validators.required]),
        obra_social: new FormControl(""),
        especialidad: new FormControl("")            
      });   
      this.formularioRegistro.get('tipo')?.valueChanges.subscribe(tipo => 
      {
        if (tipo === 'paciente') 
        {
          this.formularioRegistro.get('obra_social')?.setValidators([Validators.required]);
        } 
        else 
        {
          this.formularioRegistro.get('obra_social')?.clearValidators();
          this.formularioRegistro.get('especialidad')?.setValidators([Validators.required]);
        }        
        this.formularioRegistro.get('obra_social')?.updateValueAndValidity();
        this.formularioRegistro.get('especialidad')?.updateValueAndValidity();
    }); 
  }

  async register() 
  {
    this.errorMessage = '';
    this.message = '';
    this.isLoading = true;  

    try 
    {          
      const formatosPermitidos = ['image/png', 'image/jpeg'];

      if (!this.avatarFile) 
      {
        this.errorMessage = '⚠ Debes subir una imagen de perfil.';
        return;
      }

      if (!formatosPermitidos.includes(this.avatarFile.type)) 
      {
        this.errorMessage = '⚠ La imagen de perfil debe ser PNG o JPEG.';
        return;
      }

      if (this.formularioRegistro.get('tipo')?.value === 'paciente') 
      {
        if (!this.avatarFile2) 
        {
          this.errorMessage = '⚠ Los pacientes deben subir una segunda imagen.';
          return;
        }

        if (!formatosPermitidos.includes(this.avatarFile2.type))
        {
            this.errorMessage = '⚠ La segunda imagen debe ser PNG o JPEG.';
            return;
        }
      }    
      
      const email = this.formularioRegistro.get('mail')?.value;

      const { data: pacienteData, error: pacienteError } = await supabase
          .from('pacientes')
          .select('id')
          .eq('mail', email)
          .single();

      const { data: especialistaData, error: especialistaError } = await supabase
          .from('especialistas')
          .select('id')
          .eq('mail', email)
          .single();                      
         
      if (pacienteData || especialistaData) 
      {
        this.errorMessage = '⚠ Este email ya está registrado.';
        return;
      }

      const { data, error } = await supabase.auth.signUp(
      {
        email: email,
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

      let insertError;

      const usuarioData: Usuario = 
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
      if (this.formularioRegistro.get('tipo')?.value === 'paciente' && this.avatarFile2 != null) 
      {
        this.paciente =
        {
          ... usuarioData,
          imagen_perfil_2: await this.subirFoto(this.avatarFile2, "avatars", userId),          
          obra_social: this.formularioRegistro.get('obra_social')?.value         
        }
        console.log(this.paciente);
        
      }
      else if (this.formularioRegistro.get('tipo')?.value === 'especialista') 
      {
        this.especialista =
        {
          ... usuarioData,
          especialidad: this.formularioRegistro.get('especialidad')?.value          
        }
        console.log(this.especialista);        
      } 
      if(this.paciente != null)
      {
        const { error } = await supabase.from('pacientes').insert([this.paciente]);
        insertError = error;
      }
      if(this.especialista != null)
      {
        const { error } = await supabase.from('especialistas').insert([this.especialista]);
        insertError = error;
      }        
         

      this.message = 'Registro exitoso. ¡Bienvenido!';
      this.messageType = 'success';
    } 
    catch (err) 
    {
      this.errorMessage = 'Ocurrió un error inesperado al registrar';
    }
    finally 
    {
      this.isLoading = false;
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
