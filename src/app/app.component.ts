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
    await supabase.auth.signOut();
    this.isLoggedIn = false;
    this.authService.logout();
    this.cd.detectChanges(); 
    this.router.navigate(['/login']);
  }
}
