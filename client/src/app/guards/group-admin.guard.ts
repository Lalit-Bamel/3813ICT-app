import { inject }
    from '@angular/core';

import {
    CanActivateFn,
    Router
} from '@angular/router';

import {
    catchError,
    map,
    of
} from 'rxjs';


import {
    AuthService
} from '../services/auth.service';

import {
    GroupService
} from '../services/group.service';


export const groupAdminGuard:
    CanActivateFn = route => {


    const authService =
        inject(AuthService);

    const groupService =
        inject(GroupService);

    const router =
        inject(Router);


    const user =
        authService.getCurrentUser();


    const groupId =
        route.paramMap.get('groupId');


    if (!user || !groupId) {

        return router.createUrlTree([
            '/groups'
        ]);
    }


    return groupService
        .getGroup(groupId)
        .pipe(

            map(group => {

                if (
                    group.adminIds
                        .includes(user.id)
                ) {
                    return true;
                }

                return router
                    .createUrlTree([
                        '/groups'
                    ]);
            }),

            catchError(() =>
                of(
                    router.createUrlTree([
                        '/groups'
                    ])
                )
            )
        );
};