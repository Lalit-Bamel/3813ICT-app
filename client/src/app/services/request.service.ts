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
export class RequestService {

    private http =
        inject(HttpClient);

    private apiUrl =
        'http://localhost:3000/api/requests';


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


    getSuperAdminRequests(
        userId: string
    ) {

        return this.http.get<Request[]>(
            `${this.apiUrl}/super-admin/${userId}`
        );
    }


    getGroupJoinRequests(
        userId: string,
        groupId: string
    ) {

        return this.http.get<Request[]>(
            `${this.apiUrl}/group-admin/${userId}/${groupId}`
        );
    }


    getUserRequestHistory(
        userId: string
    ) {

        return this.http.get<Request[]>(
            `${this.apiUrl}/user/${userId}/history`
        );
    }


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