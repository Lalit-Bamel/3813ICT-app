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
/**
 * Handles registration, login and the current authenticated user state.
 * The current user is persisted in localStorage and exposed through an Angular signal.
 */
export class AuthService {

    private http = inject(HttpClient);

    private apiUrl = 'http://localhost:3000/api';
    private storageKey = 'currentUser';
    private currentUserSignal = signal<User | null>(
    this.loadStoredUser()
);

    readonly currentUser = this.currentUserSignal.asReadonly();
    /**
     * Sends new account details to the backend registration endpoint.
     */
    register(data: RegisterData) {
        return this.http.post<AuthResponse>(
            `${this.apiUrl}/register`,
            data
        );
    }

    /**
     * Authenticates a user and stores the returned user when login succeeds.
     */
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
    /**
     * Restores the previously authenticated user from browser localStorage.
     */
    private loadStoredUser(): User | null {

    const storedUser =
        localStorage.getItem(this.storageKey);

    if (!storedUser) {
        return null;
    }

    return JSON.parse(storedUser) as User;
}

/**
 * Stores the authenticated user in localStorage and updates the reactive signal.
 */
setCurrentUser(user: User) {

    localStorage.setItem(
        this.storageKey,
        JSON.stringify(user)
    );

    this.currentUserSignal.set(user);
}


/**
 * Returns the current authenticated user, or null when no user is logged in.
 */
getCurrentUser(): User | null {
    return this.currentUserSignal();
}


/**
 * Clears the persisted and in-memory authenticated user state.
 */
logout() {

    localStorage.removeItem(this.storageKey);

    this.currentUserSignal.set(null);
}


/**
 * Returns whether a user is currently authenticated.
 */
isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
}


/**
 * Returns whether the current user has the Super Administrator system role.
 */
isSuperAdmin(): boolean {

    return this.currentUserSignal()?.systemRole
        === 'superAdmin';
}
}