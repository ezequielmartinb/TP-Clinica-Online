import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit
{
  isLoading:boolean = true;
  nombre:string = "";
  apellido:string = "";
  rol:string = "";
  mail: string | undefined = undefined;

  async ngOnInit() 
  {
    const { data, error } = await supabase.auth.getUser();

    if (data?.user) 
    {
      this.nombre = localStorage.getItem('nombre') || '';
      this.apellido = localStorage.getItem('apellido') || '';
      this.rol = localStorage.getItem('rol') || '';

      this.mail = data.user.email;
      console.log("Email del usuario:", this.mail);
    }    
    this.isLoading = false;
  }
}
