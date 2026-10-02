import {
    Injectable,
    inject
} from '@angular/core';

import {
    HttpClient
} from '@angular/common/http';

import {
    Request
} from '../models/request';


@Injectable({
    providedIn: 'root'
})
/**
 * Handles creation, retrieval and approval/rejection of application requests.
 */
export class RequestService {

    private http =
        inject(HttpClient);

    private apiUrl =
        'http://localhost:3000/api/requests';


    /**
     * Creates a request for the Super Administrator to create a new group.
     */
    createGroupRequest(
        requesterId: string,
        data: {
            title: string;
            description: string;
            minimumAge: number;
            theme: string;
        }
    ) {

        return this.http.post(
            `${this.apiUrl}/group-creation`,
            {
                requesterId,
                ...data
            }
        );
    }


    /**
     * Creates a request for a user to join an existing group.
     */
    requestJoin(
        requesterId: string,
        groupId: string
    ) {

        return this.http.post(
            `${this.apiUrl}/join`,
            {
                requesterId,
                groupId
            }
        );
    }


    /**
     * Creates a request for a Group Administrator to create a room.
     */
    createRoomRequest(
        requesterId: string,
        groupId: string,
        roomName: string
    ) {

        return this.http.post(
            `${this.apiUrl}/room-creation`,
            {
                requesterId,
                groupId,
                roomName
            }
        );
    }


    /**
     * Creates a request to ban a selected user from a specific group.
     */
    createGroupBanRequest(
        requesterId: string,
        groupId: string,
        targetUserId: string,
        reason: string
    ) {

        return this.http.post(
            `${this.apiUrl}/group-ban`,
            {
                requesterId,
                groupId,
                targetUserId,
                reason
            }
        );
    }


    /**
     * Creates a request for a permanent system-wide user ban.
     */
    createSystemBanRequest(
        requesterId: string,
        groupId: string,
        targetUserId: string,
        reason: string
    ) {

        return this.http.post(
            `${this.apiUrl}/system-ban`,
            {
                requesterId,
                groupId,
                targetUserId,
                reason
            }
        );
    }


    /**
     * Creates a request for the Super Administrator to delete a group.
     */
    createGroupDeletionRequest(
        requesterId: string,
        groupId: string,
        reason: string
    ) {

        return this.http.post(
            `${this.apiUrl}/group-deletion`,
            {
                requesterId,
                groupId,
                reason
            }
        );
    }


    /**
     * Retrieves pending requests that require Super Administrator action.
     */
    getSuperAdminRequests(
        userId: string
    ) {

        return this.http.get<Request[]>(
            `${this.apiUrl}/super-admin/${userId}`
        );
    }


    /**
     * Retrieves pending requests for a specific Group Administrator and group.
     */
    getGroupJoinRequests(
        userId: string,
        groupId: string
    ) {

        return this.http.get<Request[]>(
            `${this.apiUrl}/group-admin/${userId}/${groupId}`
        );
    }


    /**
     * Retrieves the request history belonging to a user.
     */
    getUserRequestHistory(
        userId: string
    ) {

        return this.http.get<Request[]>(
            `${this.apiUrl}/user/${userId}/history`
        );
    }


    /**
     * Approves or rejects an existing request and optionally includes a rejection reason.
     */
    actionRequest(
        requestId: string,
        actorId: string,
        status: 'approved' | 'rejected',
        rejectionReason = ''
    ) {

        return this.http.put(
            `${this.apiUrl}/${requestId}`,
            {
                actorId,
                status,
                rejectionReason
            }
        );
    }
}