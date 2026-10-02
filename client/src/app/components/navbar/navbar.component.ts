import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
    Router,
    RouterLink
} from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    imports: [
        CommonModule,
        RouterLink
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css'
})
/**
 * Provides shared authenticated navigation, Super Administrator visibility checks and logout.
 */
export class NavbarComponent {

    private authService = inject(AuthService);
    private router = inject(Router);
        currentUser = this.authService.currentUser;
        /**
         * Returns whether the current user has the Super Administrator system role.
         */
        get isSuperAdmin(): boolean {
         return this.currentUser()?.systemRole === 'superAdmin';
    }

    /**
     * Logs out the current user and navigates back to the login page.
     */
    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}