import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent 
{
  mail: string | null = null;

  ngOnInit() 
  {
    this.mail = localStorage.getItem('mail');
  }
}
