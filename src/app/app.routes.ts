import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { ErrorComponent } from './componentes/error/error.component';

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
        path:'**',
        component:ErrorComponent
    }
];
