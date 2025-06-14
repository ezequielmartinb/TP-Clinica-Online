import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './servicios/auth.service';
import { environment } from '../environments/environment';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent 
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
      const { data: session } = await supabase.auth.getSession();
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
      this.cd.detectChanges();

    } catch (err) {
      console.error("⚠ Error inesperado al cerrar sesión:", err);
    }
  }

}
