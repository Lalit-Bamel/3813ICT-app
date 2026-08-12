import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    imports: [
        CommonModule,
        FormsModule,
        RouterLink
    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent {

    private authService = inject(AuthService);
    private router = inject(Router);

    firstName = '';
    lastName = '';
    username = '';
    email = '';
    age: number | null = null;
    password = '';

    errorMessage = '';

    onSubmit() {
        this.errorMessage = '';

        if (this.age === null) {
            this.errorMessage = 'Age is required.';
            return;
        }

        this.authService.register({
            firstName: this.firstName,
            lastName: this.lastName,
            username: this.username,
            email: this.email,
            age: this.age,
            password: this.password
        }).subscribe({
            next: () => {
                this.router.navigate(['/login']);
            },

            error: error => {
                this.errorMessage =
                    error.error?.message ||
                    'Unable to create account.';
            }
        });
    }
}