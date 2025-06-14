import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  mail:string = "";
  password:string = "";
  errorMessage:string="";
  message:string="";
  messageType:string="";
  formularioLogin!:FormGroup;  
  isLoading:boolean = false;

  constructor(private router: Router, private authService: AuthService) 
  {
    
  }
  ngOnInit()
  {
    this.formularioLogin = new FormGroup(
    {
      mail: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });  
  }

  async login() {
    this.errorMessage = '';
    this.isLoading = true;
  
    try {
      const email = this.formularioLogin.get('mail')?.value;
      const password = this.formularioLogin.get('password')?.value;
  
      // Autenticación en Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error || !data?.user) {
        this.errorMessage = '⚠ Email o contraseña incorrectos.';
        return;
      }
  
      const userId = data.user.id;
      const emailVerificado = data.user.email_confirmed_at;
  
      // Buscar usuario en la base de datos
      let usuario;
      let tipoUsuario = '';
  
      const { data: adminData } = await supabase.from('administradores').select('id').eq('id', userId).maybeSingle();
      if (adminData) {
        usuario = adminData;
        tipoUsuario = 'admin';
      }
  
      const { data: pacienteData } = await supabase.from('pacientes').select('id').eq('id', userId).maybeSingle();
      if (pacienteData) {
        usuario = pacienteData;
        tipoUsuario = 'paciente';
      }
  
      const { data: especialistaData } = await supabase.from('especialistas').select('id, aprobado').eq('id', userId).maybeSingle();
      if (especialistaData) 
      {
        usuario = especialistaData;
        tipoUsuario = 'especialista';
  
        // Verificar que el especialista esté aprobado
        if (!especialistaData.aprobado) 
        {
          this.errorMessage = '⚠ Tu cuenta debe ser aprobada por un administrador.';
          return;
        }
      }
  
      if (!usuario) {
        this.errorMessage = '⚠ Usuario no encontrado.';
        return;
      }
  
      // Redirigir según el tipo de usuario
      this.router.navigate(['/home']);  
    } 
    catch (error) 
    {
      this.errorMessage = '⚠ Error al iniciar sesión.';
    } 
    finally 
    {
      this.isLoading = false;
    }
  }
  

  public quickAccessPaciente()
  {
    this.formularioLogin.patchValue({
      mail: "ezequielmartinb10@gmail.com",
      password: "123456"
  });

  }
  public quickAccessEspecialista()
  {
    this.formularioLogin.patchValue({
        mail: "ezequielmartinb10@gmail.com",
        password: "123456"
    });

  }
  public quickAccessAdmin()
  {
    this.formularioLogin.patchValue({
        mail: "ezequielmartinb10@gmail.com",
        password: "123456"
    });
  }
}
