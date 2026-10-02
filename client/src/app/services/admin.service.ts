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

import {
    AuditLog
} from '../models/audit-log';


@Injectable({
    providedIn: 'root'
})
/**
 * Handles Super Administrator HTTP requests for banned users and audit logs.
 */
export class AdminService {

    private http =
        inject(HttpClient);

    private apiUrl =
        'http://localhost:3000/api/admin';


    /**
     * Retrieves all permanently banned users for an authorised Super Administrator.
     */
    getBannedUsers(
        userId: string
    ) {

        return this.http.get<BannedUser[]>(
            `${this.apiUrl}/banned-users/${userId}`
        );
    }


    /**
     * Retrieves administrative audit logs for an authorised Super Administrator.
     */
    getAuditLogs(
        userId: string
    ) {

        return this.http.get<AuditLog[]>(
            `${this.apiUrl}/audit-logs/${userId}`
        );
    }
}