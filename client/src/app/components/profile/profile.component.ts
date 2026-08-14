import { CommonModule } from '@angular/common';
import {
    Component,
    inject,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';
import { NavbarComponent } from '../navbar/navbar.component';


@Component({
    selector: 'app-profile',
    imports: [
        CommonModule,
        FormsModule,
        NavbarComponent
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

    private authService = inject(AuthService);
    private userService = inject(UserService);
    private cdr = inject(ChangeDetectorRef);

    currentUser: User | null =
        this.authService.getCurrentUser();


    firstName = '';
    lastName = '';
    username = '';
    email = '';
    age: number | null = null;

    profilePicture = '';

    newPassword = '';

    errorMessage = '';
    successMessage = '';


    ngOnInit() {

        if (!this.currentUser) {
            return;
        }

        this.loadFields(this.currentUser);

        this.userService
            .getProfile(this.currentUser.id)
            .subscribe({
                next: user => {
                    this.currentUser = user;

                    this.authService
                        .setCurrentUser(user);

                    this.loadFields(user);

                    this.cdr.markForCheck();
                },

                error: error => {
                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load profile.';
                }
            });
    }


    private loadFields(user: User) {
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.username = user.username;
        this.email = user.email;
        this.age = user.age;
        this.profilePicture =
            user.profilePicture || '';
    }


    onProfilePictureSelected(event: Event) {

        const input =
            event.target as HTMLInputElement;

        const file =
            input.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.errorMessage =
                'Please select an image file.';
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            this.profilePicture =
                reader.result as string;
            input.value ='';
            this.cdr.markForCheck();
        
            };

        reader.readAsDataURL(file);
    }


    onSubmit() {

        this.errorMessage = '';
        this.successMessage = '';

        if (
            !this.currentUser ||
            this.age === null
        ) {
            return;
        }

        this.userService
            .updateProfile(
                this.currentUser.id,
                {
                    firstName: this.firstName,
                    lastName: this.lastName,
                    username: this.username,
                    age: this.age,
                    profilePicture:
                        this.profilePicture,
                    newPassword:
                        this.newPassword || undefined
                }
            )
            .subscribe({
                 next: response => {
                
                    this.currentUser = response.user;
                
                    this.authService
                        .setCurrentUser(response.user);
                
                    this.newPassword = '';
                
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
}