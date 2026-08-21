import {
    Routes
} from '@angular/router';


import {
    LoginComponent
} from './components/login/login.component';

import {
    RegisterComponent
} from './components/register/register.component';

import {
    GroupsComponent
} from './components/groups/groups.component';

import {
    ProfileComponent
} from './components/profile/profile.component';

import {
    SuperAdminComponent
} from './components/super-admin/super-admin.component';

import {
    GroupAdminComponent
} from './components/group-admin/group-admin.component';

import {
    GroupRoomsComponent
} from './components/group-rooms/group-rooms.component';

import {
    ChatRoomComponent
} from './components/chat-room/chat-room.component';


import {
    authGuard
} from './guards/auth.guard';

import {
    userGuard
} from './guards/user.guard';

import {
    superAdminGuard
} from './guards/super-admin.guard';

import {
    groupAdminGuard
} from './guards/group-admin.guard';


export const routes:
    Routes = [

    {
        path: '',

        redirectTo: 'login',

        pathMatch: 'full'
    },


    {
        path: 'login',

        component:
            LoginComponent
    },


    {
        path: 'register',

        component:
            RegisterComponent
    },


    {
        path: 'groups',

        component:
            GroupsComponent,

        canActivate: [
            authGuard,
            userGuard
        ]
    },


    {
        path: 'profile',

        component:
            ProfileComponent,

        canActivate: [
            authGuard,
            userGuard
        ]
    },


    // CHAT ROOM
    // Keep this before the generic group route.

    {
        path:
            'groups/:groupId/rooms/:roomId',

        component:
            ChatRoomComponent,

        canActivate: [
            authGuard,
            userGuard
        ]
    },


    // GROUP ADMIN

    {
        path:
            'groups/:groupId/admin',

        component:
            GroupAdminComponent,

        canActivate: [
            authGuard,
            userGuard,
            groupAdminGuard
        ]
    },


    // GROUP ROOMS

    {
        path:
            'groups/:groupId',

        component:
            GroupRoomsComponent,

        canActivate: [
            authGuard,
            userGuard
        ]
    },


    // SUPER ADMIN

    {
        path:
            'super-admin',

        component:
            SuperAdminComponent,

        canActivate: [
            authGuard,
            superAdminGuard
        ]
    },


    // ALWAYS LAST

    {
        path: '**',

        redirectTo: 'login'
    }
];