import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService 
{

  private mail: string | null = null;
  private rol: string | null = null;

  setUsuario(mail: string) 
  {
    this.mail = mail;
    localStorage.setItem('mail', mail);
  }
  getUsuario(): string | null 
  {
    return this.mail || localStorage.getItem('mail');
  }
  setRol(rol: string) 
  {
    this.rol = rol;
    localStorage.setItem('rol', rol);
  }

  logout(): void 
  {
    this.mail = null;
    localStorage.removeItem('mail');
  } 
  public isValidEmail(email: string): boolean 
  {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

}
