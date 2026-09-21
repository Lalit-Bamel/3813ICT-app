import {
    CommonModule
} from '@angular/common';

import {
    Component,
    inject,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';

import {
    FormsModule
} from '@angular/forms';

import {
    AuthService
} from '../../services/auth.service';

import {
    UserService
} from '../../services/user.service';

import {
    User
} from '../../models/user';

import {
    NavbarComponent
} from '../navbar/navbar.component';


@Component({
    selector: 'app-profile',

    imports: [
        CommonModule,
        FormsModule,
        NavbarComponent
    ],

    templateUrl:
        './profile.component.html',

    styleUrl:
        './profile.component.css'
})
export class ProfileComponent
implements OnInit {

    private authService =
        inject(AuthService);

    private userService =
        inject(UserService);

    private cdr =
        inject(ChangeDetectorRef);


    currentUser:
        User | null =
        this.authService
            .getCurrentUser();


    firstName = '';

    lastName = '';

    username = '';

    email = '';

    age:
        number | null = null;

    dateOfBirth = '';

    dateOfBirthIsEstimated = false;

    maxDateOfBirth =
        this.getLatestDateOfBirth();


    profilePicture = '';

    selectedProfilePictureFile:
        File | null = null;


    newPassword = '';


    errorMessage = '';

    successMessage = '';


    // ==========================================
    // INITIALISE PROFILE
    // ==========================================

    ngOnInit() {

        if (!this.currentUser) {
            return;
        }


        this.loadFields(
            this.currentUser
        );


        this.userService
            .getProfile(
                this.currentUser.id
            )
            .subscribe({

                next: user => {

                    this.currentUser =
                        user;


                    this.authService
                        .setCurrentUser(
                            user
                        );


                    this.loadFields(
                        user
                    );


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load profile.';


                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // LOAD PROFILE FIELDS
    // ==========================================

    private loadFields(
        user: User
    ) {

        this.firstName =
            user.firstName;

        this.lastName =
            user.lastName;

        this.username =
            user.username;

        this.email =
            user.email;

        this.dateOfBirthIsEstimated =
            !user.dateOfBirth;

        this.dateOfBirth =
            user.dateOfBirth ||
            this.inferDateOfBirth(
                user.age
            );

        this.age =
            this.calculateAge(
                this.dateOfBirth
            );

        this.profilePicture =
            user.profilePicture || '';
    }


    // ==========================================
    // PROFILE IMAGE URL
    // ==========================================

    getProfilePictureUrl(
        content: string
    ): string {

        if (!content) {
            return '';
        }


        if (
            content.startsWith(
                'http://'
            ) ||
            content.startsWith(
                'https://'
            ) ||
            content.startsWith(
                'data:'
            )
        ) {
            return content;
        }


        return (
            'http://localhost:3000' +
            content
        );
    }


    // ==========================================
    // SELECT PROFILE IMAGE
    // ==========================================

    onProfilePictureSelected(
        event: Event
    ) {

        const input =
            event.target as
                HTMLInputElement;


        const file =
            input.files?.[0];


        if (!file) {
            return;
        }


        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            this.errorMessage =
                'Please select a JPG, PNG, GIF or WEBP image.';

            input.value = '';

            this.cdr.markForCheck();

            return;
        }


        if (
            file.size >
            5 * 1024 * 1024
        ) {

            this.errorMessage =
                'Image must be 5 MB or smaller.';

            input.value = '';

            this.cdr.markForCheck();

            return;
        }


        this.selectedProfilePictureFile =
            file;


        /*
         * FileReader is only used to create
         * a local browser preview.
         *
         * The Base64 result is never stored
         * in MongoDB.
         */
        const reader =
            new FileReader();


        reader.onload = () => {

            this.profilePicture =
                reader.result as string;

            this.errorMessage =
                '';

            this.cdr.markForCheck();
        };


        reader.onerror = () => {

            this.errorMessage =
                'Unable to preview profile picture.';

            this.selectedProfilePictureFile =
                null;

            this.cdr.markForCheck();
        };


        reader.readAsDataURL(
            file
        );


        input.value = '';
    }


    // ==========================================
    // SAVE PROFILE
    // ==========================================

    onDateOfBirthChanged() {

        this.dateOfBirthIsEstimated =
            false;

        this.age =
            this.calculateAge(
                this.dateOfBirth
            );
    }


    private calculateAge(
        dateOfBirth: string
    ): number | null {

        if (!dateOfBirth) {
            return null;
        }

        const birthDate =
            new Date(
                `${dateOfBirth}T00:00:00`
            );

        const today = new Date();

        if (
            Number.isNaN(
                birthDate.getTime()
            ) ||
            birthDate > today
        ) {
            return null;
        }

        let age =
            today.getFullYear() -
            birthDate.getFullYear();

        const monthDifference =
            today.getMonth() -
            birthDate.getMonth();

        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() <
                    birthDate.getDate()
            )
        ) {
            age -= 1;
        }

        return age >= 1 && age <= 120
            ? age
            : null;
    }


    private inferDateOfBirth(
        age: number
    ): string {

        const inferred = new Date();

        inferred.setFullYear(
            inferred.getFullYear() - age
        );

        return this.toDateInputValue(
            inferred
        );
    }


    private toDateInputValue(
        date: Date
    ): string {

        const year =
            date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, '0');

        const day = String(
            date.getDate()
        ).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }


    private getLatestDateOfBirth(): string {

        const latestDate = new Date();

        latestDate.setDate(
            latestDate.getDate() - 1
        );

        return this.toDateInputValue(
            latestDate
        );
    }

    onSubmit() {

        this.errorMessage = '';

        this.successMessage = '';


        if (
            !this.currentUser ||
            this.age === null ||
            !this.dateOfBirth
        ) {

            this.errorMessage =
                'Please select a valid date of birth. Age must be at least 1.';

            this.cdr.markForCheck();

            return;
        }


        this.userService
            .updateProfile(
                this.currentUser.id,
                {
                    firstName:
                        this.firstName,

                    lastName:
                        this.lastName,

                    username:
                        this.username,

                    age:
                        this.age,

                    dateOfBirth:
                        this.dateOfBirth,

                    /*
                     * Do not send the local Base64
                     * preview into MongoDB.
                     *
                     * Keep the existing stored path.
                     */
                    profilePicture:
                        this.currentUser
                            .profilePicture ||
                        '',

                    newPassword:
                        this.newPassword ||
                        undefined
                }
            )
            .subscribe({

                next: response => {

                    this.currentUser =
                        response.user;


                    this.authService
                        .setCurrentUser(
                            response.user
                        );


                    this.newPassword =
                        '';


                    if (
                        this.selectedProfilePictureFile
                    ) {

                        this.uploadProfilePicture();

                        return;
                    }


                    this.loadFields(
                        response.user
                    );


                    this.successMessage =
                        response.message;


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to update profile.';


                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // UPLOAD PROFILE PICTURE
    // ==========================================

    private uploadProfilePicture() {

        if (
            !this.currentUser ||
            !this.selectedProfilePictureFile
        ) {
            return;
        }


        this.userService
            .uploadProfilePicture(
                this.currentUser.id,
                this.selectedProfilePictureFile
            )
            .subscribe({

                next: response => {

                    this.currentUser =
                        response.user;


                    this.authService
                        .setCurrentUser(
                            response.user
                        );


                    this.selectedProfilePictureFile =
                        null;


                    this.loadFields(
                        response.user
                    );


                    this.successMessage =
                        'Profile updated successfully.';


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Profile information was updated, but the profile picture could not be uploaded.';


                    this.cdr.markForCheck();
                }
            });
    }
}
