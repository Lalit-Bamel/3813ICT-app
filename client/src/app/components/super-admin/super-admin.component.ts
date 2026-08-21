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

    bannedUsers: BannedUser[] = [];


    rejectingRequestId:
        string | null = null;

    rejectionReason = '';
    systemBanTargetId: string | null = null;

    systemBanReason = '';


    errorMessage = '';

    successMessage = '';


    ngOnInit() {

        this.loadRequests();

        this.loadBannedUsers();
    }


    // ============================================
    // LOAD SUPER ADMIN REQUESTS
    // ============================================

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


    // ============================================
    // LOAD PERMANENTLY BANNED USERS
    // ============================================

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


    // ============================================
    // APPROVE REQUEST
    // ============================================

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


    // ============================================
    // START REJECTION
    // ============================================

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


    // ============================================
    // CANCEL REJECTION
    // ============================================

    cancelReject() {

        this.rejectingRequestId =
            null;

        this.rejectionReason = '';

        this.errorMessage = '';

        this.cdr.markForCheck();
    }


    // ============================================
    // CONFIRM REJECTION
    // ============================================

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

                    this.rejectionReason =
                        '';


                    this.loadRequests();


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