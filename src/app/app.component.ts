import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './servicios/auth.service';
import { environment } from '../environments/environment';
import { createClient } from '@supabase/supabase-js';
import { trigger, transition, style, animate, query, animateChild, group, state, keyframes } from '@angular/animations';


const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('routeAnimations', [
      transition('LoginPage => HomePage', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition('HomePage => RegistroPage', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition('* => LoginPage', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AppComponent implements AfterViewInit
{
  isLoggedIn: boolean = false;
  errorMessage: string = '';

  constructor(private cd: ChangeDetectorRef, private router: Router) {}

  async ngOnInit() {
    await this.checkSession();

    // Detectar cambios de estado en la autenticación
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await this.checkSession(); // Verificar si el usuario tiene acceso
      } else {
        this.isLoggedIn = false;
        this.cd.detectChanges();
      }
    });
  }
  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
  ngAfterViewInit(): void {
    this.cd.detectChanges(); // Forzar reevaluación del binding
  }

  
  async checkSession() {
    const { data } = await supabase.auth.getSession();
    const usuario = data.session?.user;   

    if (!usuario) {
      this.isLoggedIn = false;
      this.cd.detectChanges();
      return;
    }

    // Buscar al usuario en las tablas disponibles (admin, especialista, paciente)
    let tipoUsuario = '';
    let usuarioData;
    

    const { data: adminData } = await supabase.from('administradores').select('id').eq('id', usuario.id).maybeSingle();
    if (adminData) {
      usuarioData = adminData;
      tipoUsuario = 'admin';
    }
    

    const { data: pacienteData } = await supabase.from('pacientes').select('id').eq('id', usuario.id).maybeSingle();
    if (pacienteData) {
      usuarioData = pacienteData;
      tipoUsuario = 'paciente';
    }

    const { data: especialistaData } = await supabase.from('especialistas').select('id, aprobado').eq('id', usuario.id).maybeSingle();
    if (especialistaData) {
      usuarioData = especialistaData;
      tipoUsuario = 'especialista';

      // 🚨 Bloquear acceso si el especialista no está aprobado 🚨
      if (!especialistaData.aprobado) {
        console.warn("⚠ Este especialista aún no ha sido aprobado.");
        await supabase.auth.signOut(); // Cerrar sesión inmediatamente
        this.isLoggedIn = false;
        this.router.navigate(['/login']); // Redirigir al login
        this.cd.detectChanges();
        return;
      }
    }

    if (!usuarioData) {
      console.warn("⚠ Usuario no encontrado en ninguna tabla.");
      await supabase.auth.signOut(); // Cerrar sesión si no existe
      this.isLoggedIn = false;
      this.router.navigate(['/login']);
      this.cd.detectChanges();
      return;
    }

    // ✅ Usuario válido, permitir acceso
    this.isLoggedIn = true;
    this.cd.detectChanges();
  }

  async logout() {
    try {
      const { data: session, error:sessionError } = await supabase.auth.getSession();
      console.log("Datos de sesión:", session, sessionError);
      if (!session?.session) {
        console.warn("⚠ No hay una sesión activa.");
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("⚠ Error al cerrar sesión:", error.message);
        return;
      }

      this.isLoggedIn = false;
      this.router.navigate(['/login']);
      localStorage.clear();
      this.cd.detectChanges();

    } catch (err) {
      console.error("⚠ Error inesperado al cerrar sesión:", err);
    }
  }

}
