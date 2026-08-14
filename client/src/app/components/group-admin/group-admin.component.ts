import {
    ChangeDetectorRef,
    Component,
    inject,
    OnInit
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    ActivatedRoute,
    RouterLink
} from '@angular/router';


import {
    AuthService
} from '../../services/auth.service';

import {
    GroupService
} from '../../services/group.service';

import {
    RequestService
} from '../../services/request.service';

import {
    Group
} from '../../models/group';

import {
    Request
} from '../../models/request';

import {
    NavbarComponent
} from '../navbar/navbar.component';


@Component({
    selector: 'app-group-admin',

    imports: [
        CommonModule,
        RouterLink,
        NavbarComponent
    ],

    templateUrl:
        './group-admin.component.html',

    styleUrl:
        './group-admin.component.css'
})
export class GroupAdminComponent
    implements OnInit {


    private route =
        inject(ActivatedRoute);

    private authService =
        inject(AuthService);

    private groupService =
        inject(GroupService);

    private requestService =
        inject(RequestService);

    private cdr =
        inject(ChangeDetectorRef);


    currentUser =
        this.authService.currentUser;


    group: Group | null = null;

    joinRequests: Request[] = [];

    errorMessage = '';


    ngOnInit() {

        const groupId =
            this.route.snapshot
                .paramMap
                .get('groupId');


        if (!groupId) {
            return;
        }


        this.loadGroup(groupId);

        this.loadRequests(groupId);
    }


    loadGroup(groupId: string) {

        this.groupService
            .getGroup(groupId)
            .subscribe({

                next: group => {

                    this.group = group;

                    this.cdr
                        .markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load group.';

                    this.cdr
                        .markForCheck();
                }
            });
    }


    loadRequests(groupId: string) {

        const user =
            this.currentUser();

        if (!user) {
            return;
        }


        this.requestService
            .getGroupJoinRequests(
                user.id,
                groupId
            )
            .subscribe({

                next: requests => {

                    this.joinRequests =
                        requests;

                    this.cdr
                        .markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load requests.';

                    this.cdr
                        .markForCheck();
                }
            });
    }


    approve(request: Request) {

        const user =
            this.currentUser();

        if (!user || !this.group) {
            return;
        }


        this.requestService
            .actionRequest(
                request.id,
                user.id,
                'approved'
            )
            .subscribe({

                next: () => {

                    this.loadRequests(
                        this.group!.id
                    );

                    this.loadGroup(
                        this.group!.id
                    );
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to approve request.';

                    this.cdr
                        .markForCheck();
                }
            });
    }


    reject(request: Request) {

        const reason = window.prompt(
            'Enter rejection reason:'
        );


        if (!reason?.trim()) {
            return;
        }


        const user =
            this.currentUser();

        if (!user || !this.group) {
            return;
        }


        this.requestService
            .actionRequest(
                request.id,
                user.id,
                'rejected',
                reason
            )
            .subscribe({

                next: () => {

                    this.loadRequests(
                        this.group!.id
                    );
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to reject request.';

                    this.cdr
                        .markForCheck();
                }
            });
    }
}