import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit
{
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

  async login() 
  {
    let user:any = null;
    let rol:string = "";
    this.isLoading = true;
    this.message = '';

    try 
    {
      const email = this.formularioLogin.get('mail')?.value;
      const password = this.formularioLogin.get('password')?.value;

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      });

      if (loginError) 
      {
        this.errorMessage = '⚠ Usuario o contraseña incorrectos.';
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) 
      {
        this.errorMessage = '⚠ No hay una sesión activa.';
        return;
      }

      if (!sessionData.session.user?.email_confirmed_at) 
      {
        this.errorMessage = '⚠ Debes confirmar tu correo antes de iniciar sesión.';
        return;
      }

      const { data: pacienteData } = await supabase
          .from('pacientes')
          .select('*')
          .filter('mail', 'eq', email)
          .single();
      if (pacienteData) 
      {
        user = pacienteData;
        rol = 'paciente';
      }
    

      const { data: especialistaData } = await supabase
          .from('especialistas')
          .select('*')
          .filter('mail', 'eq', email)
          .single();

      if (especialistaData) 
      {
        user = especialistaData;
        rol = 'especialista';
      }

      const { data: adminData } = await supabase
          .from('administradores')
          .select('*')
          .filter('mail', 'eq', email)
          .single();

      if (adminData) 
      {
        user = adminData;
        rol = 'administrador';
      }

      localStorage.setItem('nombre', user.nombre);
      localStorage.setItem('apellido', user.apellido);
      localStorage.setItem('rol', rol);
      localStorage.setItem('mail', email);


      if (!pacienteData && !especialistaData && !adminData) 
      {
        this.errorMessage = '⚠ El usuario no está registrado.';
        return;
      }

      this.message = '✅ Inicio de sesión exitoso. Bienvenido!';
      this.authService.setUsuario(email);
      this.messageType = 'success';
      this.router.navigate(['/home']);
    } 
    catch (err) 
    {
      this.errorMessage = '⚠ Error inesperado al iniciar sesión.';
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
