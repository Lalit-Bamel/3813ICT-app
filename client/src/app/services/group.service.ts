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
export class GroupService {

    private http =
        inject(HttpClient);

    private apiUrl =
        'http://localhost:3000/api/groups';


    getGroups() {

        return this.http.get<Group[]>(
            this.apiUrl
        );
    }


    getGroup(groupId: string) {

        return this.http.get<Group>(
            `${this.apiUrl}/${groupId}`
        );
    }

    getGroupMembers(groupId: string) {

    return this.http.get<GroupMember[]>(
        `${this.apiUrl}/${groupId}/members`
    );
}


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
}