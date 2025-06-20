import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { ErrorComponent } from './componentes/error/error.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = 
[
    {
        path:'',
        pathMatch:'full',
        redirectTo:'home'
    },
    {
        path:'home',
        component: HomeComponent
    },
    {
        path:'login',
        loadComponent: () => import('./componentes/login/login.component').then(l=> l.LoginComponent)
    },
    {
        path:'registro',
        loadComponent: () => import('./componentes/registro/registro.component').then(r=> r.RegistroComponent)
    }, 
    {
        path:'mi-perfil',
        loadComponent: () => import('./componentes/mi-perfil/mi-perfil.component').then(m=> m.MiPerfilComponent)
    },   
    {
        path:'solicitar-turnos',
        loadComponent: () => import('./componentes/solicitar-turnos/solicitar-turnos.component').then(s=> s.SolicitarTurnosComponent)
    },
    {
        path:'mis-turnos',
        loadComponent: () => import('./componentes/mis-turnos/mis-turnos.component').then(t=> t.MisTurnosComponent)
    },
    {
        path:'admin/usuarios',
        loadComponent: () => import('./componentes/seccion-usuarios/seccion-usuarios.component').then(r=> r.SeccionUsuariosComponent),
        canActivate: [authGuard]
    },
    {
        path:'**',
        component:ErrorComponent
    }
];
