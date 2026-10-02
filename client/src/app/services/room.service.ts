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

import {
    Message
} from '../models/message';


@Injectable({
    providedIn: 'root'
})
/**
 * Handles room management, message history, chat-image uploads and message deletion.
 */
export class RoomService {

    private http =
        inject(HttpClient);


    private groupApi =
        'http://localhost:3000/api/groups';

    private roomApi =
        'http://localhost:3000/api/rooms';

    private uploadApi =
        'http://localhost:3000/api/uploads';


    // ==========================================
    // GET GROUP ROOMS
    // ==========================================

    /**
     * Retrieves all rooms belonging to a selected group.
     */
    getRooms(
        groupId: string
    ) {

        return this.http.get<Room[]>(
            `${this.groupApi}/${groupId}/rooms`
        );
    }


    // ==========================================
    // GET ONE ROOM
    // ==========================================

    /**
     * Retrieves a single room by its application ID.
     */
    getRoom(
        roomId: string
    ) {

        return this.http.get<Room>(
            `${this.roomApi}/${roomId}`
        );
    }


    // ==========================================
    // CREATE ROOM
    // ==========================================

    /**
     * Creates a room directly when the acting user has Group Administrator permission.
     */
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


    // ==========================================
    // RENAME ROOM
    // ==========================================

    /**
     * Renames an existing room on behalf of an authorised Group Administrator.
     */
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


    // ==========================================
    // DELETE ROOM
    // ==========================================

    /**
     * Deletes a room using the acting administrator ID for backend authorisation.
     */
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


    // ==========================================
    // GET LAST 5 MESSAGES
    // ==========================================

    /**
     * Retrieves the five most recent non-deleted messages for a room.
     */
    getMessages(
        roomId: string,
        userId: string
    ) {

        return this.http.get<Message[]>(
            `${this.roomApi}/${roomId}/messages`,
            {
                params: {
                    userId,
                    limit: 5
                }
            }
        );
    }


    // ==========================================
    // LEGACY REST SEND MESSAGE
    // ==========================================

    /**
     * Sends a message through the legacy REST endpoint; live chat normally uses Socket.IO.
     */
    sendMessage(
        roomId: string,
        senderId: string,
        type:
            'text' |
            'image' |
            'gif',
        content: string
    ) {

        return this.http.post<{
            message: string;
            chatMessage: Message;
        }>(
            `${this.roomApi}/${roomId}/messages`,
            {
                senderId,
                type,
                content
            }
        );
    }


    // ==========================================
    // UPLOAD CHAT IMAGE
    // ==========================================

    /**
     * Uploads a chat image using multipart FormData and returns the created chat message.
     */
    uploadChatImage(
        roomId: string,
        senderId: string,
        file: File
    ) {

        const formData =
            new FormData();


        formData.append(
            'roomId',
            roomId
        );

        formData.append(
            'senderId',
            senderId
        );

        formData.append(
            'image',
            file
        );


        return this.http.post<{
            message: string;
            chatMessage: Message;
        }>(
            `${this.uploadApi}/chat-image`,
            formData
        );
    }


    // ==========================================
    // DELETE OWN MESSAGE
    // ==========================================

    /**
     * Soft-deletes a message when the acting user owns that message.
     */
    deleteMessage(
        roomId: string,
        messageId: string,
        actorId: string
    ) {

        return this.http.delete<{
            message: string;
        }>(
            `${this.roomApi}/${roomId}/messages/${messageId}`,
            {
                body: {
                    actorId
                }
            }
        );
    }
}