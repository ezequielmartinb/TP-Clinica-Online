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
  public isLoggedIn = false;

  constructor(private router: Router, private cd: ChangeDetectorRef, private authService: AuthService) {} 

  async ngOnInit() 
  {
    await this.checkSession();

    supabase.auth.onAuthStateChange((_event, session) => 
    {
      this.isLoggedIn = !!session?.user;
      this.cd.detectChanges(); 
    });
  }

  async checkSession() 
  {
    const { data } = await supabase.auth.getSession();    
    this.isLoggedIn = !!data.session?.user;
    this.cd.detectChanges(); 
  }

  async logout() 
  {
    try {
        // 🔹 Verificar si hay una sesión antes de cerrar
        const { data: session } = await supabase.auth.getSession();

        if (!session?.session) {
            console.warn("⚠ No hay una sesión activa.");
            return;
        }

        // 🔹 Cerrar sesión en Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("⚠ Error al cerrar sesión:", error.message);
            return;
        }

        // 🔹 Actualizar estado de sesión
        this.isLoggedIn = false;
        this.authService.logout();

        // 🔹 Detectar cambios en la vista para actualización inmediata
        this.cd.detectChanges();

        // 🔹 Redirigir al usuario a la página de login
        this.router.navigate(['/login']);

    } 
    catch (err) {
        console.error("⚠ Error inesperado al cerrar sesión:", err);
    }
}
}
