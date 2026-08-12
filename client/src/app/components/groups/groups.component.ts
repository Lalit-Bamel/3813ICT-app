import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-groups',
    imports: [
        CommonModule
    ],
    templateUrl: './groups.component.html',
    styleUrl: './groups.component.css'
})
export class GroupsComponent {

    private authService = inject(AuthService);
    private router = inject(Router);

    currentUser = this.authService.getCurrentUser();

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}