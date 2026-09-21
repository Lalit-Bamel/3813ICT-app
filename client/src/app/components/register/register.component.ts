import {
    CommonModule
} from '@angular/common';

import {
    Component,
    inject,
    ChangeDetectorRef
} from '@angular/core';

import {
    FormsModule
} from '@angular/forms';

import {
    Router,
    RouterLink
} from '@angular/router';

import {
    AuthService
} from '../../services/auth.service';


@Component({
    selector: 'app-register',

    imports: [
        CommonModule,
        FormsModule,
        RouterLink
    ],

    templateUrl:
        './register.component.html',

    styleUrl:
        './register.component.css'
})
export class RegisterComponent {

    private authService =
        inject(AuthService);

    private router =
        inject(Router);

    private cdr =
        inject(ChangeDetectorRef);


    firstName = '';

    lastName = '';

    username = '';

    email = '';

    dateOfBirth = '';

    calculatedAge:
        number | null = null;

    password = '';


    errorMessage = '';


    // ==========================================
    // MAXIMUM DATE
    // ==========================================

    /*
     * Prevents the browser date picker
     * from selecting a future date.
     */
    get latestDateOfBirth(): string {

        const now =
            new Date();

        now.setDate(
            now.getDate() - 1
        );

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                '0'
            );

        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                '0'
            );


        return (
            `${year}-${month}-${day}`
        );
    }


    // ==========================================
    // DATE OF BIRTH CHANGED
    // ==========================================

    onDateOfBirthChange() {

        this.errorMessage = '';

        this.calculatedAge =
            this.calculateAge(
                this.dateOfBirth
            );

        if (
            this.calculatedAge !== null &&
            this.calculatedAge < 1
        ) {
            this.errorMessage =
                'Age must be at least 1.';
        }
    }


    // ==========================================
    // CALCULATE AGE
    // ==========================================

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

        const today =
            new Date();


        if (
            Number.isNaN(
                birthDate.getTime()
            )
        ) {
            return null;
        }


        if (
            birthDate >
            today
        ) {
            return null;
        }


        let age =
            today.getFullYear() -
            birthDate.getFullYear();


        const monthDifference =
            today.getMonth() -
            birthDate.getMonth();


        /*
         * If the user's birthday has not
         * occurred yet this year,
         * subtract one from the age.
         */
        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() <
                birthDate.getDate()
            )
        ) {

            age--;
        }


        return age;
    }


    // ==========================================
    // REGISTER
    // ==========================================

    onSubmit() {

        this.errorMessage = '';


        const age =
            this.calculateAge(
                this.dateOfBirth
            );


        if (age === null || age < 1) {

            this.errorMessage =
                'Please select a valid date of birth. Age must be at least 1.';

            this.cdr.markForCheck();

            return;
        }


        this.calculatedAge =
            age;


        this.authService
            .register({
                firstName:
                    this.firstName,

                lastName:
                    this.lastName,

                username:
                    this.username,

                email:
                    this.email,

                /*
                 * Backend still receives the
                 * same numeric age as before.
                 */
                age:
                    age,

                password:
                    this.password
            })
            .subscribe({

                next: () => {

                    this.router.navigate([
                        '/login'
                    ]);


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to create account.';


                    this.cdr.markForCheck();
                }
            });
    }
}
