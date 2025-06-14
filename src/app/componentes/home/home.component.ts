import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent 
{
  isAdmin: boolean = false;
  usuarioAutenticado: boolean = false;
  cargandoBotones:boolean = true;

  constructor(private cd: ChangeDetectorRef, private router: Router) {}

  async ngOnInit() {
    await this.verificarAdmin();
    const { data } = await supabase.auth.getSession();
    this.usuarioAutenticado = !!data.session?.user;
    this.cargandoBotones = false;
  }

  async verificarAdmin() {
    const { data } = await supabase.auth.getSession();
    console.log('Sesión:', data);
    
    const usuario = data.session?.user;
    if (!usuario) {
      this.isAdmin = false;
      this.cd.detectChanges();
      return;
    }
  
    const { data: adminData, error } = await supabase
      .from('administradores')
      .select('id')
      .eq('id', usuario.id)
      .maybeSingle();
  
    console.log('AdminData:', adminData, 'Error:', error);
  
    this.isAdmin = !!adminData;
    this.cd.detectChanges();
  }
  

  irASeccionUsuarios() {
    if (this.isAdmin) {
      this.router.navigate(['/admin/usuarios']);
    }
  }

}
