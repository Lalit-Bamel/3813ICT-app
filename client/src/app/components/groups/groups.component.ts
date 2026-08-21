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
    FormsModule
} from '@angular/forms';

import {
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
    selector: 'app-groups',

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        NavbarComponent
    ],

    templateUrl:
        './groups.component.html',

    styleUrl:
        './groups.component.css'
})
export class GroupsComponent
implements OnInit {

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


    groups: Group[] = [];

    requestHistory: Request[] = [];


    searchTerm = '';

    showGroupRequestForm = false;


    requestTitle = '';

    requestDescription = '';

    requestMinimumAge:
        number | null = null;

    requestTheme = 'default';


    successMessage = '';

    errorMessage = '';


    ngOnInit() {

        this.loadGroups();

        this.loadRequestHistory();
    }


    loadGroups() {

        this.groupService
            .getGroups()
            .subscribe({

                next: groups => {

                    this.groups =
                        groups;

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load groups.';

                    this.cdr.markForCheck();
                }
            });
    }


    loadRequestHistory() {

        const user =
            this.currentUser();


        if (!user) {
            return;
        }


        this.requestService
            .getUserRequestHistory(
                user.id
            )
            .subscribe({

                next: requests => {

                    this.requestHistory =
                        requests;

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load request history.';

                    this.cdr.markForCheck();
                }
            });
    }


    get filteredGroups():
        Group[] {

        const search =
            this.searchTerm
                .trim()
                .toLowerCase();


        if (!search) {
            return this.groups;
        }


        return this.groups.filter(
            group =>
                group.title
                    .toLowerCase()
                    .includes(search)
                ||
                group.description
                    .toLowerCase()
                    .includes(search)
        );
    }


    isMember(
        group: Group
    ): boolean {

        const user =
            this.currentUser();


        if (!user) {
            return false;
        }


        return group.memberIds
            .includes(user.id);
    }


    isAdmin(
        group: Group
    ): boolean {

        const user =
            this.currentUser();


        if (!user) {
            return false;
        }


        return group.adminIds
            .includes(user.id);
    }


    requestJoin(
        group: Group
    ) {

        const user =
            this.currentUser();


        if (!user) {
            return;
        }


        this.errorMessage = '';
        this.successMessage = '';


        this.requestService
            .requestJoin(
                user.id,
                group.id
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        `Join request sent for ${group.title}.`;

                    this.loadRequestHistory();

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to request membership.';

                    this.cdr.markForCheck();
                }
            });
    }


    submitGroupRequest() {

        const user =
            this.currentUser();


        if (
            !user ||
            this.requestMinimumAge === null
        ) {
            return;
        }


        this.errorMessage = '';
        this.successMessage = '';


        this.requestService
            .createGroupRequest(
                user.id,
                {
                    title:
                        this.requestTitle,

                    description:
                        this.requestDescription,

                    minimumAge:
                        this.requestMinimumAge,

                    theme:
                        this.requestTheme
                }
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'Group creation request submitted.';

                    this.showGroupRequestForm =
                        false;

                    this.requestTitle = '';

                    this.requestDescription = '';

                    this.requestMinimumAge =
                        null;

                    this.requestTheme =
                        'default';

                    this.loadRequestHistory();

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to request group creation.';

                    this.cdr.markForCheck();
                }
            });
    }


    getRequestTypeLabel(
        request: Request
    ): string {

        switch (request.type) {

            case 'groupCreation':
                return 'Group Creation';

            case 'joinGroup':
                return 'Join Group';

            case 'roomCreation':
                return 'Room Creation';

            case 'groupBan':
                return 'Group Ban';

            case 'systemBan':
                return 'System Ban';

            case 'groupDeletion':
                return 'Group Deletion';

            default:
                return request.type;
        }
    }


    getRequestSubject(
        request: Request
    ): string {

        if (
            request.type ===
            'groupCreation'
        ) {
            return (
                request.details?.title ||
                'New Group'
            );
        }


        if (
            request.type ===
            'roomCreation'
        ) {
            return (
                request.details?.roomName ||
                'New Room'
            );
        }


        if (
            request.type ===
            'groupDeletion'
        ) {
            return (
                request.groupTitle ||
                request.details?.groupTitle ||
                'Group'
            );
        }


        if (
            request.targetUsername
        ) {
            return request.targetUsername;
        }


        if (
            request.groupTitle
        ) {
            return request.groupTitle;
        }


        return '-';
    }
}