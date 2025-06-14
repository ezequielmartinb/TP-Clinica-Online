import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';
import { inject } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

export const authGuard: CanActivateFn = async (route, state) => 
{
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = auth.getUsuario();
  console.log('El usuario logueado desde el guard es: ' + usuario);  
  try 
  {
    console.log(`✅ Verificando si ${usuario} es administrador...`);
    const { data, error } = await supabase.from('administradores').select('id').eq('mail', usuario).single();

    if (error || !data) 
    {
      console.warn(`⚠ Acceso denegado. ${usuario} no está en la tabla de administradores.`);
      router.navigate(['/login']);
      return false;
    }

    console.log(`✅ Acceso permitido. ${usuario} es administrador.`);
    return true;
  } 
  catch (err) 
  {
    console.error("⚠ Error al verificar permisos de administrador:", err);
    router.navigate(['/login']);
    return false;
  }

};
