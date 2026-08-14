import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { User } from '../models/user';


interface ProfileUpdate {
    firstName: string;
    lastName: string;
    username: string;
    age: number;
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
export class UserService {

    private http = inject(HttpClient);

    private apiUrl = 'http://localhost:3000/api/users';


    getProfile(userId: string) {
        return this.http.get<User>(
            `${this.apiUrl}/${userId}`
        );
    }


    updateProfile(
        userId: string,
        profile: ProfileUpdate
    ) {
        return this.http.put<ProfileResponse>(
            `${this.apiUrl}/${userId}`,
            profile
        );
    }
}