import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import { inject } from '@angular/core';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

export const sessionGuard: CanActivateFn = async(route, state) => 
{
  const router = inject(Router);

  const { data, error } = await supabase.auth.getSession();

  if (data.session) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
