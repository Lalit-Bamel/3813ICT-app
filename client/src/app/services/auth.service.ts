import { Injectable, inject,signal } from '@angular/core';
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
    private currentUserSignal = signal<User | null>(
    this.loadStoredUser()
);

    readonly currentUser = this.currentUserSignal.asReadonly();
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
                    this.setCurrentUser(response.user);
                })
                );
                }
    private loadStoredUser(): User | null {

    const storedUser =
        localStorage.getItem(this.storageKey);

    if (!storedUser) {
        return null;
    }

    return JSON.parse(storedUser) as User;
}

setCurrentUser(user: User) {

    localStorage.setItem(
        this.storageKey,
        JSON.stringify(user)
    );

    this.currentUserSignal.set(user);
}


getCurrentUser(): User | null {
    return this.currentUserSignal();
}


logout() {

    localStorage.removeItem(this.storageKey);

    this.currentUserSignal.set(null);
}


isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
}


isSuperAdmin(): boolean {

    return this.currentUserSignal()?.systemRole
        === 'superAdmin';
}
}