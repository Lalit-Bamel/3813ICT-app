import {
    Injectable,
    inject
} from '@angular/core';

import { HttpClient }
    from '@angular/common/http';

import { Group }
    from '../models/group';


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
}