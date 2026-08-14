import { Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { GroupsComponent } from './components/groups/groups.component';
import { SuperAdminComponent } from './components/super-admin/super-admin.component';

import { authGuard } from './guards/auth.guard';
import { superAdminGuard } from './guards/super-admin.guard';
import { userGuard } from './guards/user.guard';
import { ProfileComponent }
    from './components/profile/profile.component';
export const routes: Routes = [

    {
        path: 'login',
        component: LoginComponent
    },

    {
        path: 'register',
        component: RegisterComponent
    },

    {
        path: 'groups',
        component: GroupsComponent,
        canActivate: [authGuard,userGuard]
    },

    {
        path: 'super-admin',
        component: SuperAdminComponent,
        canActivate: [
            authGuard,
            superAdminGuard
        ]
    },

    {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [
        authGuard,
        userGuard
    ]
},

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },

    {
        path: '**',
        redirectTo: 'login'
    }

];