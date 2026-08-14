import { ChangeDetectorRef,Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    imports: [
        FormsModule,
        RouterLink,
        CommonModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {

    private authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    username = '';
    password = '';

    errorMessage = '';

    onSubmit() {
        this.errorMessage = '';

        this.authService
    .login(this.username, this.password)
    .subscribe({

        next: response => {

            if (response.user.systemRole === 'superAdmin') {
                this.router.navigate(['/super-admin']);
            } else {
                this.router.navigate(['/groups']);
            }

            this.cdr.markForCheck();
        },

        error: error => {

            this.errorMessage =
                error.error?.message ||
                'Unable to log in.';

            this.cdr.markForCheck();
        }
    });
    }
}