import {
    Injectable,
    inject
} from '@angular/core';

import {
    HttpClient
} from '@angular/common/http';

import {
    Room
} from '../models/room';


@Injectable({
    providedIn: 'root'
})
export class RoomService {

    private http = inject(HttpClient);


    private groupApi =
        'http://localhost:3000/api/groups';

    private roomApi =
        'http://localhost:3000/api/rooms';


    getRooms(groupId: string) {

        return this.http.get<Room[]>(
            `${this.groupApi}/${groupId}/rooms`
        );
    }


    createRoom(
        groupId: string,
        actorId: string,
        name: string
    ) {

        return this.http.post(
            `${this.groupApi}/${groupId}/rooms`,
            {
                actorId,
                name
            }
        );
    }


    renameRoom(
        roomId: string,
        actorId: string,
        name: string
    ) {

        return this.http.put(
            `${this.roomApi}/${roomId}`,
            {
                actorId,
                name
            }
        );
    }


    deleteRoom(
        roomId: string,
        actorId: string
    ) {

        return this.http.delete(
            `${this.roomApi}/${roomId}`,
            {
                body: {
                    actorId
                }
            }
        );
    }
}