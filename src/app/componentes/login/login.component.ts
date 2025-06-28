import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Administrador, Especialidades, Especialista, Paciente, Usuario } from '../../modelos/interface';
import { RecaptchaFormsModule, RecaptchaModule, RecaptchaV3Module, ReCaptchaV3Service } from 'ng-recaptcha';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RecaptchaModule, RecaptchaFormsModule, RecaptchaV3Module],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',  
})
export class LoginComponent {
  mail:string = "";
  password:string = "";
  errorMessage:string="";
  message:string="";
  messageType:string="";
  formularioLogin!:FormGroup;  
  isLoading:boolean = false;
  pacientes:Paciente[] = [];
  especialistas:Especialista[] = [];
  administrador:Administrador | undefined;
  isLoadingUsuarios = false;

  constructor(private router: Router, private authService: AuthService, private recaptchaV3Service: ReCaptchaV3Service) 
  {
    
  }
  ngOnInit()
  {
    this.formularioLogin = new FormGroup(
    {
      mail: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      recaptcha: new FormControl('', [Validators.required])
    });
    this.cargarUsuarios();   
  }
  onCaptchaResolved(captchaResponse: string | null): void {
    if (captchaResponse) {
      this.formularioLogin.get('recaptcha')?.setValue(captchaResponse);
    } else {
      this.formularioLogin.get('recaptcha')?.setValue(null);
      // Si querés, podés también marcar el control como inválido manualmente
      this.formularioLogin.get('recaptcha')?.setErrors({ invalid: true });
    }
  }
  
  
  async login() {
    this.errorMessage = '';
    this.isLoading = true;
  
    this.recaptchaV3Service.execute('login').subscribe(async (token: string) => {
      if (!token) {
        this.errorMessage = '⚠ Error al verificar reCAPTCHA.';
        this.isLoading = false;
        return;
      }
  
      // Podés guardarlo si lo querés enviar al backend
      this.formularioLogin.get('recaptcha')?.setValue(token);
  
      const email = this.formularioLogin.get('mail')?.value;
      const password = this.formularioLogin.get('password')?.value;
  
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
        if (error || !data?.user) {
          this.errorMessage = '⚠ Email o contraseña incorrectos.';
          return;
        }
  
        const userId = data.user.id;
  
        let usuario;
        let tipoUsuario = '';
  
        const { data: adminData } = await supabase.from('administradores').select('id').eq('id', userId).maybeSingle();
        if (adminData) { usuario = adminData; tipoUsuario = 'administrador'; }
  
        const { data: pacienteData } = await supabase.from('pacientes').select('id').eq('id', userId).maybeSingle();
        if (pacienteData) { usuario = pacienteData; tipoUsuario = 'paciente'; }
  
        const { data: especialistaData } = await supabase.from('especialistas').select('id, aprobado').eq('id', userId).maybeSingle();
        if (especialistaData) {
          if (!especialistaData.aprobado) {
            this.errorMessage = '⚠ Tu cuenta debe ser aprobada por un administrador.';
            return;
          }
          usuario = especialistaData;
          tipoUsuario = 'especialista';
        }
  
        if (!usuario) {
          this.errorMessage = '⚠ Usuario no encontrado.';
          return;
        }
  
        this.authService.setUsuario(email);
        this.authService.setId(userId);
        this.authService.setRol(tipoUsuario);
        this.router.navigate(['/home']);
      } catch (e) {
        this.errorMessage = '⚠ Error al iniciar sesión.';
      } finally {
        this.isLoading = false;
      }
    });
  
  }  
  async obtenerUsuarios<T>(tabla: string, limite: number): Promise<T[]> {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .limit(limite);
  
    if (error) {
      console.error(`Error obteniendo usuarios de ${tabla}:`, error);
      return [];
    }
  
    return data as T[];
  }
  
  async cargarUsuarios() 
  {
    this.isLoadingUsuarios = true;
    this.pacientes = await this.obtenerUsuarios<Paciente>('pacientes', 3);
    this.especialistas = await this.obtenerUsuarios<Especialista>('especialistas', 2);
    this.administrador = (await this.obtenerUsuarios<Administrador>('administradores', 1))[0];
  
    console.log('Pacientes:', this.pacientes);
    console.log('Especialistas:', this.especialistas);
    console.log('Administrador:', this.administrador);
    this.isLoadingUsuarios = false;
  }
  

  public quickAccess(usuario: Usuario) 
  {
    this.formularioLogin.patchValue(
    {
      mail: usuario.mail,
      password: usuario.contrasena,
    });
    console.log(`Acceso rápido a: ${usuario.nombre} ${usuario.apellido}`);
  }    
}