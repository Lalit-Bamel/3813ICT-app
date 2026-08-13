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
export class NavbarComponent {

    private authService = inject(AuthService);
    private router = inject(Router);

    currentUser = this.authService.getCurrentUser();

    get isSuperAdmin(): boolean {
        return this.currentUser?.systemRole === 'superAdmin';
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}