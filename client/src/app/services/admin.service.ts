import {
    Injectable,
    inject
} from '@angular/core';

import {
    HttpClient
} from '@angular/common/http';

import {
    BannedUser
} from '../models/user';


@Injectable({
    providedIn: 'root'
})
export class AdminService {

    private http =
        inject(HttpClient);

    private apiUrl =
        'http://localhost:3000/api/admin';


    getBannedUsers(
        userId: string
    ) {

        return this.http.get<BannedUser[]>(
            `${this.apiUrl}/banned-users/${userId}`
        );
    }
}