import { Component, OnInit } from '@angular/core';
import { Especialista, Paciente, Especialidades, Usuario } from '../../modelos/interface';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-registro',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit
{ 
   
  formularioRegistro!: FormGroup;
  tipoUsuario: 'paciente' | 'especialista' | null = null;  
  botonActivo: 'paciente' | 'especialista' | null = null;
  especialidades: Especialidades[] = [];
  nuevaEspecialidad: string = '';

  paciente: Paciente = {
    id: '',
    nombre: '',
    apellido: '',
    edad: 0,
    dni: '',
    mail: '',
    contrasena: '',
    obra_social: '',
    imagen_perfil_1: '',
    imagen_perfil_2: '',
    aprobado: true
  };

  especialista: Especialista = {
    id: '',
    nombre: '',
    apellido: '',
    edad: 0,
    dni: '',
    mail: '',
    contrasena: '',
    especialidad: '',
    imagen_perfil: '',
    aprobado: true
  };
  message:string = '';
  messageType: 'success' | 'error' = 'success';
  errorMessage:string = '';
  isLoading:boolean = false;


  constructor(private fb: FormBuilder) 
  {
    this.crearFormulario();
  }

  async ngOnInit() 
  {
    await this.obtenerEspecialidades();
  }

  async obtenerEspecialidades() 
  {
    const { data, error } = await supabase.from('especialidades').select('id, nombre');
    if (error) 
    {
      console.error('Error obteniendo especialidades:', error);
      return;
    }
    this.especialidades = data as Especialidades[];
  }

  async agregarEspecialidad() 
  {
    let nuevaEspecialidad = this.formularioRegistro.get('nueva_especialidad')?.value.trim();
  
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regexLetras.test(nuevaEspecialidad)) 
    {
      console.error('La especialidad solo puede contener letras.');
      return;
    }  
    nuevaEspecialidad = nuevaEspecialidad.charAt(0).toUpperCase() + nuevaEspecialidad.slice(1).toLowerCase();
  
    const existe = this.especialidades.some(especialidad => especialidad.nombre.toLowerCase() === nuevaEspecialidad.toLowerCase());
    if (existe) 
    {
      console.error('La especialidad ya existe en la base de datos.');
      return;
    }
  
    const { error } = await supabase.from('especialidades').insert([{ nombre: nuevaEspecialidad }]);
    if (error) 
    {
      console.error('Error al agregar especialidad:', error);
      return;
    }
  
    this.formularioRegistro.get('nueva_especialidad')?.setValue('');
    await this.obtenerEspecialidades();
  }  

  setTipo(tipo: 'paciente' | 'especialista') 
  {
    this.tipoUsuario = tipo;
    this.botonActivo = tipo;
    this.crearFormulario();
  }
  
  crearFormulario() 
  {
    this.formularioRegistro = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$')]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nueva_especialidad: ['',Validators.pattern('^[a-zA-ZñÑ\\s]+$')]
    });

    if (this.tipoUsuario === 'paciente') 
    {
      this.formularioRegistro.addControl('obra_social', new FormControl('', Validators.required));
      this.formularioRegistro.addControl('imagen_perfil_1', new FormControl('', Validators.required));
      this.formularioRegistro.addControl('imagen_perfil_2', new FormControl('', Validators.required));
    } 
    else if (this.tipoUsuario === 'especialista') 
    {
      this.formularioRegistro.addControl('imagen_perfil', new FormControl('', Validators.required));
      this.formularioRegistro.addControl('especialidad', new FormControl('', Validators.required));
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
  onFileSelected(event: any, controlName: string) {
    const file = event.target.files[0];
    if (file && this.formularioRegistro.controls[controlName]) 
    {
      this.formularioRegistro.controls[controlName].setValue(file);
    } 
    else 
    {
      console.error(`El control '${controlName}' no está definido en el formulario.`);
    }
  }
 
  async register() {
    this.errorMessage = '';
    this.message = '';
    this.isLoading = true;
  
    try {
      // Validar imágenes de perfil
      const formatosPermitidos = ['image/png', 'image/jpeg'];
      const imagenPerfil1 = this.formularioRegistro.get('imagen_perfil_1')?.value;
      const imagenPerfil2 = this.formularioRegistro.get('imagen_perfil_2')?.value;
      const imagenPerfilEspecialista = this.formularioRegistro.get('imagen_perfil')?.value;
  
      
  
      if (this.tipoUsuario=== 'paciente') {
        if (!imagenPerfil1) {
          this.errorMessage = '⚠ Debes subir una imagen de perfil.';
          return;
        }
    
        if (!formatosPermitidos.includes(imagenPerfil1.type)) {
          this.errorMessage = '⚠ La imagen de perfil debe ser PNG o JPEG.';
          return;
        }
        if (!imagenPerfil2) {
          this.errorMessage = '⚠ Los pacientes deben subir una segunda imagen.';
          return;
        }
  
        if (!formatosPermitidos.includes(imagenPerfil2.type)) {
          this.errorMessage = '⚠ La segunda imagen debe ser PNG o JPEG.';
          return;
        }
      }
      // ✅ Validaciones para ESPECIALISTA
      if (this.tipoUsuario === 'especialista') {
        if (!imagenPerfilEspecialista) {
          this.errorMessage = '⚠ Debes subir una imagen de perfil.';
          return;
        }

        if (!formatosPermitidos.includes(imagenPerfilEspecialista.type)) {
          this.errorMessage = '⚠ La imagen de perfil debe ser PNG o JPEG.';
          return;
        }
      }     
  
      // Verificar si el email ya está registrado
      const email = this.formularioRegistro.get('mail')?.value;
      const { data: pacienteData } = await supabase.from('pacientes').select('id').eq('mail', email).single();
      const { data: especialistaData } = await supabase.from('especialistas').select('id').eq('mail', email).single();
  
      if (pacienteData || especialistaData) {
        this.errorMessage = '⚠ Este email ya está registrado.';
        return;
      }
  
      // Registro de usuario en Supabase Authentication
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: this.formularioRegistro.get('password')?.value,
      });
  
      if (error || !data?.user) {
        this.errorMessage = this.getErrorMessage(error?.message || 'Error');
        return;
      }
  
      const userId = data.user.id;
  
      let imagenPerfilUrl = '';
      let imagenPerfil2Url = '';
  
      if (this.tipoUsuario === 'paciente' && imagenPerfil2) 
      {
        imagenPerfilUrl = await this.subirFoto(imagenPerfil1, 'avatars', userId);
        imagenPerfil2Url = await this.subirFoto(imagenPerfil2, 'avatars', userId);
      }
      else if(this.tipoUsuario === 'especialista' && imagenPerfilEspecialista) 
      {
       imagenPerfilUrl = await this.subirFoto(imagenPerfilEspecialista, 'avatars', userId);       
      }
  
      // Crear objeto de usuario
      const usuarioData: Usuario = {
        id: userId,
        nombre: this.formularioRegistro.get('nombre')?.value,
        apellido: this.formularioRegistro.get('apellido')?.value,
        edad: this.formularioRegistro.get('edad')?.value,
        dni: this.formularioRegistro.get('dni')?.value,
        mail: this.formularioRegistro.get('mail')?.value,
        contrasena: this.formularioRegistro.get('password')?.value,
        imagen_perfil: imagenPerfilUrl,
        aprobado:true
      };
  
      // Insertar en la tabla correspondiente
      if (this.tipoUsuario === 'paciente') 
      {
        this.paciente = {
          ...usuarioData,
          obra_social: this.formularioRegistro.get('obra_social')?.value,
          imagen_perfil_2: imagenPerfil2Url,
        };
        console.log(this.paciente);        
        const { error: insertError } = await supabase.from('pacientes').insert([this.paciente]);

        if (insertError) {
          console.error("Error al insertar en pacientes:", insertError.message);
        }
      } 
      else if (this.tipoUsuario === 'especialista') 
      {
        this.especialista = 
        {
          ...usuarioData,
          especialidad: this.formularioRegistro.get('especialidad')?.value,
        };
        this.especialista.aprobado = false;
        await supabase.from('especialistas').insert([this.especialista]);
      }
  
      this.message = 'Registro exitoso. ¡Bienvenido!';
      this.messageType = 'success';
    } catch (err) {
      this.errorMessage = 'Ocurrió un error inesperado al registrar.';
    } finally {
      this.isLoading = false;
    }
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
