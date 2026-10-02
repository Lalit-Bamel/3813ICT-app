import {
    Injectable,
    inject
} from '@angular/core';

import { HttpClient }
    from '@angular/common/http';

import {
    Group,
    GroupMember
} from '../models/group';

@Injectable({
    providedIn: 'root'
})
/**
 * Handles group retrieval, membership and Group Administrator operations.
 */
export class GroupService {

    private http =
        inject(HttpClient);

    private apiUrl =
        'http://localhost:3000/api/groups';


    /**
     * Retrieves all groups available to the application.
     */
    getGroups() {

        return this.http.get<Group[]>(
            this.apiUrl
        );
    }


    /**
     * Retrieves one group by its application ID.
     */
    getGroup(groupId: string) {

        return this.http.get<Group>(
            `${this.apiUrl}/${groupId}`
        );
    }

    /**
     * Retrieves the members belonging to a selected group.
     */
    getGroupMembers(groupId: string) {

    return this.http.get<GroupMember[]>(
        `${this.apiUrl}/${groupId}/members`
    );
}


/**
 * Updates editable group details on behalf of a Group Administrator.
 */
updateGroup(
    groupId: string,
    actorId: string,
    data: {
        title: string;
        description: string;
        minimumAge: number;
        theme: string;
    }
) {

    return this.http.put(
        `${this.apiUrl}/${groupId}`,
        {
            actorId,
            ...data
        }
    );
}


/**
 * Promotes an existing group member to Group Administrator.
 */
promoteAdmin(
    groupId: string,
    actorId: string,
    userId: string
) {

    return this.http.post(
        `${this.apiUrl}/${groupId}/admins/${userId}`,
        {
            actorId
        }
    );
}


/**
 * Removes Group Administrator privileges from a selected administrator.
 */
demoteAdmin(
    groupId: string,
    actorId: string,
    userId: string
) {

    return this.http.delete(
        `${this.apiUrl}/${groupId}/admins/${userId}`,
        {
            body: {
                actorId
            }
        }
    );
}


/**
 * Allows the acting administrator to resign when another administrator remains.
 */
resignAdmin(
    groupId: string,
    actorId: string
) {

    return this.http.post(
        `${this.apiUrl}/${groupId}/admins/resign`,
        {
            actorId
        }
    );
}

/**
 * Removes the current user from the selected group.
 */
leaveGroup(
    groupId: string,
    userId: string
) {
    return this.http.post<{
        message: string;
    }>(
        `${this.apiUrl}/${groupId}/leave`,
        {
            userId
        }
    );
}
}
