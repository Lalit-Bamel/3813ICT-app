import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

import { User } from '../models/user';

interface AuthResponse {
    message: string;
    user: User;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    age: number;
    password: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private http = inject(HttpClient);

    private apiUrl = 'http://localhost:3000/api';
    private storageKey = 'currentUser';

    register(data: RegisterData) {
        return this.http.post<AuthResponse>(
            `${this.apiUrl}/register`,
            data
        );
    }

    login(username: string, password: string) {
        return this.http.post<AuthResponse>(
            `${this.apiUrl}/login`,
            {
                username,
                password
            }
        ).pipe(
            tap(response => {
                localStorage.setItem(
                    this.storageKey,
                    JSON.stringify(response.user)
                );
            })
        );
    }

    logout() {
        localStorage.removeItem(this.storageKey);
    }

    getCurrentUser(): User | null {
        const storedUser =
            localStorage.getItem(this.storageKey);

        if (!storedUser) {
            return null;
        }

        return JSON.parse(storedUser) as User;
    }

    isLoggedIn(): boolean {
        return this.getCurrentUser() !== null;
    }
}