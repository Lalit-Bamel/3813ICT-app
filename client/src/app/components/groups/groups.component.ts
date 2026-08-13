import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
@Component({
    selector: 'app-groups',
    imports: [
        CommonModule,
        NavbarComponent
    ],
    templateUrl: './groups.component.html',
    styleUrl: './groups.component.css'
})
export class GroupsComponent {

    private authService = inject(AuthService);
    

    currentUser = this.authService.getCurrentUser();


}