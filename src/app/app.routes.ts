import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { ErrorComponent } from './componentes/error/error.component';
import { authGuard } from './guards/auth.guard';
import { sessionGuard } from './guards/session.guard';

export const routes: Routes = 
[
    {
        path:'',
        pathMatch:'full',
        redirectTo:'home'
    },
    {
        path:'home',
        component: HomeComponent,
        data: { animation: 'HomePage' }
    },
    {
        path:'login',
        loadComponent: () => import('./componentes/login/login.component').then(l=> l.LoginComponent),
        data: { animation: 'LoginPage' }

    },
    {
        path:'registro',
        loadComponent: () => import('./componentes/registro/registro.component').then(r=> r.RegistroComponent),
        data: { animation: 'RegistroPage' }

    }, 
    {
        path:'mi-perfil',
        loadComponent: () => import('./componentes/mi-perfil/mi-perfil.component').then(m=> m.MiPerfilComponent),
        canActivate: [sessionGuard]
    },   
    {
        path:'seccion-paciente',
        loadComponent: () => import('./componentes/seccion-pacientes/seccion-pacientes.component').then(s=> s.SeccionPacientesComponent),
        canActivate: [sessionGuard]
    },   
    {
        path:'solicitar-turnos',
        loadComponent: () => import('./componentes/solicitar-turnos/solicitar-turnos.component').then(s=> s.SolicitarTurnosComponent),
        canActivate: [sessionGuard]
    },
    {
        path:'mis-turnos',
        loadComponent: () => import('./componentes/mis-turnos/mis-turnos.component').then(t=> t.MisTurnosComponent),
        canActivate: [sessionGuard]
    },
    {
        path:'encuesta',
        loadComponent: () => import('./componentes/mi-encuesta/mi-encuesta.component').then(m=> m.MiEncuestaComponent),
        canActivate: [sessionGuard]
    },
    {
        path:'historia-clinica',
        loadComponent: () => import('./componentes/historia-clinica/historia-clinica.component').then(h=> h.HistoriaClinicaComponent)
    },
    {
        path:'admin/usuarios',
        loadComponent: () => import('./componentes/seccion-usuarios/seccion-usuarios.component').then(r=> r.SeccionUsuariosComponent),
        canActivate: [authGuard]
    },
    {
        path:'admin/turnos',
        loadComponent: () => import('./componentes/turnos-admin/turnos-admin.component').then(t=> t.TurnosAdminComponent),
        canActivate: [authGuard]
    },
    {
        path:'admin/informes',
        loadComponent: () => import('./componentes/informes/informes.component').then(i=> i.InformesComponent),
        canActivate: [authGuard]
    },
    {
        path:'admin/informes/logs',
        loadComponent: () => import('./componentes/informes/logs/logs.component').then(l=> l.LogsComponent),
        canActivate: [authGuard]
    },
    {
        path:'admin/informes/turnos-especialidad',
        loadComponent: () => import('./componentes/informes/turnos-especialidad/turnos-especialidad.component').then(t=> t.TurnosEspecialidadComponent),
        canActivate: [authGuard]
    },
    {
        path:'admin/informes/turnos-por-dia',
        loadComponent: () => import('./componentes/informes/turnos-dia/turnos-dia.component').then(t=> t.TurnosDiaComponent),
        canActivate: [authGuard]
    },
    {
        path:'**',
        component:ErrorComponent
    }
];
