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
    ActivatedRoute,
    RouterLink,
    Router
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
    Group,
    GroupMember
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
        FormsModule,
        RouterLink,
        NavbarComponent
    ],

    templateUrl:
        './group-admin.component.html',

    styleUrl:
        './group-admin.component.css'
})
export class GroupAdminComponent implements OnInit {

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


    rejectingRequestId: string | null = null;

    rejectionReason = '';



    errorMessage = '';

    loadMembers(groupId: string) {

    this.groupService
        .getGroupMembers(groupId)
        .subscribe({

            next: members => {

                this.members =
                    members;

                this.cdr.markForCheck();
            },

            error: error => {

                this.errorMessage =
                    error.error?.message ||
                    'Unable to load members.';

                this.cdr.markForCheck();
            }
        });
}

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

        this.loadMembers(groupId);
    }

saveGroupChanges() {

    const user =
        this.currentUser();


    if (
        !user ||
        !this.group ||
        this.editMinimumAge === null
    ) {
        return;
    }


    this.errorMessage = '';
    this.successMessage = '';


    this.groupService
        .updateGroup(
            this.group.id,
            user.id,
            {
                title:
                    this.editTitle,

                description:
                    this.editDescription,

                minimumAge:
                    this.editMinimumAge,

                theme:
                    this.editTheme
            }
        )
        .subscribe({

            next: () => {

                this.successMessage =
                    'Group updated successfully.';

                this.loadGroup(
                    this.group!.id
                );

                this.loadMembers(
                    this.group!.id
                );

                this.cdr.markForCheck();
            },

            error: error => {

                this.errorMessage =
                    error.error?.message ||
                    'Unable to update group.';

                this.cdr.markForCheck();
            }
        });
}
isAdmin(member: GroupMember): boolean {

    return (
        this.group?.adminIds
            .includes(member.id)
        ?? false
    );
}

promote(member: GroupMember) {

    const user =
        this.currentUser();


    if (!user || !this.group) {
        return;
    }


    this.groupService
        .promoteAdmin(
            this.group.id,
            user.id,
            member.id
        )
        .subscribe({

            next: () => {

                this.successMessage =
                    `${member.username} promoted to Group Administrator.`;

                this.loadGroup(
                    this.group!.id
                );

                this.cdr.markForCheck();
            },

            error: error => {

                this.errorMessage =
                    error.error?.message ||
                    'Unable to promote member.';

                this.cdr.markForCheck();
            }
        });
}

demote(member: GroupMember) {

    const user =
        this.currentUser();


    if (!user || !this.group) {
        return;
    }


    const confirmed =
        window.confirm(
            `Demote ${member.username} from Group Administrator?`
        );


    if (!confirmed) {
        return;
    }


    this.groupService
        .demoteAdmin(
            this.group.id,
            user.id,
            member.id
        )
        .subscribe({

            next: () => {

                this.successMessage =
                    `${member.username} is no longer a Group Administrator.`;

                this.loadGroup(
                    this.group!.id
                );

                this.cdr.markForCheck();
            },

            error: error => {

                this.errorMessage =
                    error.error?.message ||
                    'Unable to demote administrator.';

                this.cdr.markForCheck();
            }
        });
}

resign() {

    const user =
        this.currentUser();


    if (!user || !this.group) {
        return;
    }


    const confirmed =
        window.confirm(
            'Resign as Group Administrator?'
        );


    if (!confirmed) {
        return;
    }


    this.groupService
        .resignAdmin(
            this.group.id,
            user.id
        )
        .subscribe({

            next: () => {

                this.router.navigate([
                    '/groups',
                    this.group!.id
                ]);
            },

            error: error => {

                this.errorMessage =
                    error.error?.message ||
                    'Unable to resign.';

                this.cdr.markForCheck();
            }
        });
}

    loadGroup(groupId: string) {

        this.groupService
            .getGroup(groupId)
            .subscribe({

        next: group => {
        
            this.group = group;
        
            this.editTitle =
                group.title;
        
            this.editDescription =
                group.description;
        
            this.editMinimumAge =
                group.minimumAge;
        
            this.editTheme =
                group.theme;
        
            this.cdr.markForCheck();
        },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load group.';

                    this.cdr.markForCheck();
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

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load requests.';

                    this.cdr.markForCheck();
                }
            });
    }


    approve(request: Request) {

        const user =
            this.currentUser();


        if (!user || !this.group) {
            return;
        }


        this.errorMessage = '';

        this.successMessage = '';


        this.requestService
            .actionRequest(
                request.id,
                user.id,
                'approved'
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'Request approved successfully.';

                    this.loadRequests(
                        this.group!.id
                    );

                    this.loadGroup(
                        this.group!.id
                    );

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to approve request.';

                    this.cdr.markForCheck();
                }
            });
    }


    startReject(request: Request) {

        this.rejectingRequestId =
            request.id;

        this.rejectionReason = '';

        this.errorMessage = '';

        this.successMessage = '';
    }


    cancelReject() {

        this.rejectingRequestId = null;

        this.rejectionReason = '';
    }


    confirmReject(request: Request) {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.group ||
            !this.rejectionReason.trim()
        ) {

            this.errorMessage =
                'Please enter a rejection reason.';

            this.cdr.markForCheck();

            return;
        }


        this.errorMessage = '';

        this.successMessage = '';


        this.requestService
            .actionRequest(
                request.id,
                user.id,
                'rejected',
                this.rejectionReason
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'Request rejected successfully.';

                    this.rejectingRequestId =
                        null;

                    this.rejectionReason = '';


                    this.loadRequests(
                        this.group!.id
                    );


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to reject request.';

                    this.cdr.markForCheck();
                }
            });
    }
    private router =
    inject(Router);


members: GroupMember[] = [];


editTitle = '';

editDescription = '';

editMinimumAge:
    number | null = null;

editTheme = 'default';


successMessage = '';
}