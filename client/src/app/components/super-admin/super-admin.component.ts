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
    NavbarComponent
} from '../navbar/navbar.component';

import {
    AuthService
} from '../../services/auth.service';

import {
    RequestService
} from '../../services/request.service';

import {
    AdminService
} from '../../services/admin.service';

import {
    Request
} from '../../models/request';

import {
    BannedUser
} from '../../models/user';

import {
    AuditLog
} from '../../models/audit-log';


@Component({
    selector: 'app-super-admin',

    imports: [
        CommonModule,
        FormsModule,
        NavbarComponent
    ],

    templateUrl:
        './super-admin.component.html',

    styleUrl:
        './super-admin.component.css'
})
export class SuperAdminComponent
implements OnInit {

    private authService =
        inject(AuthService);

    private requestService =
        inject(RequestService);

    private adminService =
        inject(AdminService);

    private cdr =
        inject(ChangeDetectorRef);


    currentUser =
        this.authService.currentUser;


    groupRequests: Request[] = [];

    systemBanRequests: Request[] = [];

    groupDeletionRequests: Request[] = [];

    bannedUsers: BannedUser[] = [];

    auditLogs: AuditLog[] = [];


    auditFilter = 'all';


    rejectingRequestId:
        string | null = null;

    rejectionReason = '';


    errorMessage = '';

    successMessage = '';


    ngOnInit() {

        this.loadRequests();

        this.loadBannedUsers();

        this.loadAuditLogs();
    }


    loadRequests() {

        const user =
            this.currentUser();


        if (!user) {
            return;
        }


        this.requestService
            .getSuperAdminRequests(
                user.id
            )
            .subscribe({

                next: requests => {

                    this.groupRequests =
                        requests.filter(
                            request =>
                                request.type ===
                                'groupCreation'
                        );


                    this.systemBanRequests =
                        requests.filter(
                            request =>
                                request.type ===
                                'systemBan'
                        );


                    this.groupDeletionRequests =
                        requests.filter(
                            request =>
                                request.type ===
                                'groupDeletion'
                        );


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


    loadBannedUsers() {

        const user =
            this.currentUser();


        if (!user) {
            return;
        }


        this.adminService
            .getBannedUsers(
                user.id
            )
            .subscribe({

                next: bannedUsers => {

                    this.bannedUsers =
                        bannedUsers;

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load banned users.';

                    this.cdr.markForCheck();
                }
            });
    }


    loadAuditLogs() {

        const user =
            this.currentUser();


        if (!user) {
            return;
        }


        this.adminService
            .getAuditLogs(
                user.id
            )
            .subscribe({

                next: logs => {

                    this.auditLogs =
                        logs;

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load audit logs.';

                    this.cdr.markForCheck();
                }
            });
    }


    get filteredAuditLogs():
        AuditLog[] {

        if (
            this.auditFilter ===
            'all'
        ) {
            return this.auditLogs;
        }


        return this.auditLogs.filter(
            log =>
                log.type ===
                this.auditFilter
        );
    }


    approveRequest(
        request: Request
    ) {

        const user =
            this.currentUser();


        if (!user) {
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

                    this.loadRequests();

                    this.loadBannedUsers();

                    this.loadAuditLogs();

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


    startReject(
        request: Request
    ) {

        this.rejectingRequestId =
            request.id;

        this.rejectionReason = '';

        this.errorMessage = '';
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


        if (!user) {
            return;
        }


        if (
            !this.rejectionReason.trim()
        ) {

            this.errorMessage =
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

                    this.rejectionReason =
                        '';

                    this.loadRequests();

                    this.loadAuditLogs();

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
}