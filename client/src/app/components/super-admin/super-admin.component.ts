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
    Request
} from '../../models/request';


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

    private cdr =
        inject(ChangeDetectorRef);


    currentUser =
        this.authService.currentUser;


    groupRequests: Request[] = [];


    rejectingRequestId:
        string | null = null;

    rejectionReason = '';


    errorMessage = '';

    successMessage = '';


    ngOnInit() {

        this.loadGroupRequests();
    }


    // ==================================================
    // LOAD PENDING GROUP CREATION REQUESTS
    // ==================================================

    loadGroupRequests() {

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
                        requests;

                    this.cdr
                        .markForCheck();
                },


                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load group requests.';

                    this.cdr
                        .markForCheck();
                }
            });
    }


    // ==================================================
    // APPROVE GROUP REQUEST
    // ==================================================

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
                        'Group request approved successfully.';


                    this.loadGroupRequests();


                    this.cdr
                        .markForCheck();
                },


                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to approve group request.';


                    this.cdr
                        .markForCheck();
                }
            });
    }


    // ==================================================
    // START REJECTION
    // ==================================================

    startReject(
        request: Request
    ) {

        this.rejectingRequestId =
            request.id;


        this.rejectionReason = '';

        this.errorMessage = '';

        this.successMessage = '';


        this.cdr
            .markForCheck();
    }


    // ==================================================
    // CANCEL REJECTION
    // ==================================================

    cancelReject() {

        this.rejectingRequestId =
            null;


        this.rejectionReason = '';

        this.errorMessage = '';


        this.cdr
            .markForCheck();
    }


    // ==================================================
    // CONFIRM REJECTION
    // ==================================================

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


            this.cdr
                .markForCheck();


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
                        'Group request rejected successfully.';


                    this.rejectingRequestId =
                        null;


                    this.rejectionReason =
                        '';


                    this.loadGroupRequests();


                    this.cdr
                        .markForCheck();
                },


                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to reject group request.';


                    this.cdr
                        .markForCheck();
                }
            });
    }
}