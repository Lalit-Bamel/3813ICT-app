import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { User } from '../models/user';


interface ProfileUpdate {
    firstName: string;
    lastName: string;
    username: string;
    age: number;
    dateOfBirth: string;
    profilePicture: string;
    newPassword?: string;
}


interface ProfileResponse {
    message: string;
    user: User;
}


@Injectable({
    providedIn: 'root'
})
/**
 * Handles profile retrieval, profile updates and profile-picture uploads.
 */
export class UserService {

    private http = inject(HttpClient);

    private apiUrl = 'http://localhost:3000/api/users';


    /**
     * Retrieves a user's current profile from the backend.
     */
    getProfile(userId: string) {
        return this.http.get<User>(
            `${this.apiUrl}/${userId}`
        );
    }


    /**
     * Sends editable profile fields to the backend for validation and persistence.
     */
    updateProfile(
        userId: string,
        profile: ProfileUpdate
    ) {
        return this.http.put<ProfileResponse>(
            `${this.apiUrl}/${userId}`,
            profile
        );
    }
    /**
     * Uploads a profile picture using multipart FormData.
     */
    uploadProfilePicture(
    userId: string,
    file: File
) {

    const formData =
        new FormData();


    formData.append(
        'userId',
        userId
    );

    formData.append(
        'image',
        file
    );


    return this.http.post<{
        message: string;
        user: User;
    }>(
        'http://localhost:3000/api/uploads/profile-image',
        formData
    );
}
}
