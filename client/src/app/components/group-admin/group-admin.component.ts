import {
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';
import {
    Subscription
} from 'rxjs';

import {
    FormsModule
} from '@angular/forms';

import {
    ActivatedRoute,
    Router,
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
    SocketService
} from '../../services/socket.service';

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
export class GroupAdminComponent
implements OnInit, OnDestroy {

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private authService =
        inject(AuthService);

    private groupService =
        inject(GroupService);

    private requestService =
        inject(RequestService);

    private socketService =
        inject(SocketService);

    private cdr =
        inject(ChangeDetectorRef);

    private groupSubscriptions:
        Subscription[] = [];


    currentUser =
        this.authService.currentUser;


    group: Group | null = null;

    members: GroupMember[] = [];

    joinRequests: Request[] = [];


    editTitle = '';

    editDescription = '';

    editMinimumAge:
        number | null = null;

    editTheme = 'default';


    rejectingRequestId:
        string | null = null;

    rejectionReason = '';


    systemBanTargetId:
        string | null = null;

    systemBanReason = '';


    showGroupDeletionForm =
        false;

    groupDeletionReason = '';


    successMessage = '';

    pageError = '';
    editError = '';
    resignError = '';
    systemBanError = '';
    groupDeletionError = '';
    memberErrors:
        Record<string, string> = {};
    requestErrors:
        Record<string, string> = {};


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

        this.subscribeToGroupUpdates(
            groupId
        );
    }

    ngOnDestroy() {

        for (
            const subscription
            of this.groupSubscriptions
        ) {
            subscription.unsubscribe();
        }

        if (this.group) {
            this.socketService
                .unsubscribeFromGroup(
                    this.group.id
                );
        }
    }

    private subscribeToGroupUpdates(
        groupId: string
    ) {

        const user = this.currentUser();

        if (!user) {
            return;
        }

        this.socketService
            .subscribeToGroup(
                groupId,
                user.id
            );

        this.groupSubscriptions.push(
            this.socketService
                .onGroupRequestsChanged()
                .subscribe(event => {

                    if (event.groupId === groupId) {
                        this.loadRequests(groupId);
                    }
                }),

            this.socketService
                .onGroupMembersChanged()
                .subscribe(event => {

                    if (event.groupId === groupId) {
                        this.loadGroup(groupId);
                        this.loadMembers(groupId);
                    }
                }),

            this.socketService
                .onGroupAccessRevoked()
                .subscribe(event => {

                    if (
                        event.groupId === groupId &&
                        event.userId === user.id
                    ) {
                        this.router.navigate([
                            '/groups'
                        ]);
                    }
                })
        );
    }


    loadGroup(groupId: string) {

        this.groupService
            .getGroup(groupId)
            .subscribe({

                next: group => {

                    const user =
                        this.currentUser();

                    if (
                        user &&
                        !group.adminIds.includes(
                            user.id
                        )
                    ) {
                        this.router.navigate(
                            group.memberIds.includes(user.id)
                                ? ['/groups', group.id]
                                : ['/groups']
                        );

                        return;
                    }

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

                    this.pageError =
                        error.error?.message ||
                        'Unable to load group.';

                    this.cdr.markForCheck();
                }
            });
    }


    loadMembers(groupId: string) {

        this.groupService
            .getGroupMembers(groupId)
            .subscribe({

                next: members => {

                    this.members = members;

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.pageError =
                        error.error?.message ||
                        'Unable to load members.';

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

                    this.pageError =
                        error.error?.message ||
                        'Unable to load requests.';

                    this.cdr.markForCheck();
                }
            });
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


        this.editError = '';
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

                    this.editError =
                        error.error?.message ||
                        'Unable to update group.';

                    this.cdr.markForCheck();
                }
            });
    }


    isAdmin(
        member: GroupMember
    ): boolean {

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

        delete this.memberErrors[
            member.id
        ];


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

                    this.memberErrors[
                        member.id
                    ] =
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

        delete this.memberErrors[
            member.id
        ];


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

                    this.memberErrors[
                        member.id
                    ] =
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

        this.resignError = '';


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

                    this.resignError =
                        error.error?.message ||
                        'Unable to resign.';

                    this.cdr.markForCheck();
                }
            });
    }


    startSystemBan(
        member: GroupMember
    ) {

        this.systemBanTargetId =
            member.id;

        this.systemBanReason = '';

        this.systemBanError = '';
        this.successMessage = '';

        this.cdr.markForCheck();
    }


    cancelSystemBan() {

        this.systemBanTargetId =
            null;

        this.systemBanReason = '';

        this.systemBanError = '';

        this.cdr.markForCheck();
    }


    confirmSystemBan(
        member: GroupMember
    ) {

        const user =
            this.currentUser();


        if (!user || !this.group) {
            return;
        }


        if (!this.systemBanReason.trim()) {

            this.systemBanError =
                'Please enter a reason for the system ban request.';

            this.cdr.markForCheck();

            return;
        }


        this.requestService
            .createSystemBanRequest(
                user.id,
                this.group.id,
                member.id,
                this.systemBanReason
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'System ban request submitted to the Super Administrator.';

                    this.systemBanTargetId =
                        null;

                    this.systemBanReason = '';

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.systemBanError =
                        error.error?.message ||
                        'Unable to submit system ban request.';

                    this.cdr.markForCheck();
                }
            });
    }


    startGroupDeletionRequest() {

        this.showGroupDeletionForm =
            true;

        this.groupDeletionReason = '';

        this.groupDeletionError = '';
        this.successMessage = '';

        this.cdr.markForCheck();
    }


    cancelGroupDeletionRequest() {

        this.showGroupDeletionForm =
            false;

        this.groupDeletionReason = '';

        this.groupDeletionError = '';

        this.cdr.markForCheck();
    }


    confirmGroupDeletionRequest() {

        const user =
            this.currentUser();


        if (!user || !this.group) {
            return;
        }


        if (
            !this.groupDeletionReason
                .trim()
        ) {

            this.groupDeletionError =
                'Please enter a reason for deleting the group.';

            this.cdr.markForCheck();

            return;
        }


        this.requestService
            .createGroupDeletionRequest(
                user.id,
                this.group.id,
                this.groupDeletionReason
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'Group deletion request submitted to the Super Administrator.';

                    this.showGroupDeletionForm =
                        false;

                    this.groupDeletionReason =
                        '';

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.groupDeletionError =
                        error.error?.message ||
                        'Unable to submit group deletion request.';

                    this.cdr.markForCheck();
                }
            });
    }


    canActionRequest(
        request: Request
    ): boolean {

        const user =
            this.currentUser();


        if (!user) {
            return false;
        }


        if (
            request.type === 'groupBan' &&
            (
                request.requesterId === user.id ||
                request.targetUserId === user.id
            )
        ) {
            return false;
        }


        return true;
    }


    approve(request: Request) {

        const user =
            this.currentUser();


        if (!user || !this.group) {
            return;
        }


        delete this.requestErrors[
            request.id
        ];
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

                    this.loadMembers(
                        this.group!.id
                    );

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.requestErrors[
                        request.id
                    ] =
                        error.error?.message ||
                        'Unable to approve request.';

                    this.cdr.markForCheck();
                }
            });
    }


    startReject(
        request: Request
    ) {

        this.rejectingRequestId =
            request.id;

        this.rejectionReason = '';

        delete this.requestErrors[
            request.id
        ];
        this.successMessage = '';

        this.cdr.markForCheck();
    }


    cancelReject() {

        this.rejectingRequestId =
            null;

        this.rejectionReason = '';

        this.cdr.markForCheck();
    }


    confirmReject(
        request: Request
    ) {

        const user =
            this.currentUser();


        if (!user || !this.group) {
            return;
        }


        if (
            !this.rejectionReason.trim()
        ) {

            this.requestErrors[
                request.id
            ] =
                'Please enter a rejection reason.';

            this.cdr.markForCheck();

            return;
        }


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

                    this.requestErrors[
                        request.id
                    ] =
                        error.error?.message ||
                        'Unable to reject request.';

                    this.cdr.markForCheck();
                }
            });
    }
}
