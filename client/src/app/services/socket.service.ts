import {
    Injectable
} from '@angular/core';

import {
    io,
    Socket
} from 'socket.io-client';

import {
    Observable
} from 'rxjs';


export interface SocketActionResult {
    success: boolean;
    message: string;
}


export interface SocketUserEvent {
    userId: string;
    username: string;
    roomId: string;
}


export interface SocketRoomUser {
    userId: string;
    username: string;
}


export interface SocketRoomUsersEvent {
    roomId: string;
    users: SocketRoomUser[];
}


export interface SocketChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    type: 'text' | 'image' | 'gif';
    content: string;
    createdAt: string;
    deleted: boolean;
    senderUsername: string;
    senderIsAdmin: boolean;
}

export interface SocketMessageDeletedEvent {
    roomId: string;
    messageId: string;
}

export interface SocketGroupEvent {
    groupId: string;
}

export interface SocketGroupAccessRevokedEvent
extends SocketGroupEvent {
    userId: string;
    reason:
        'banned' |
        'left' |
        'ageRestriction';
}

export interface SocketGroupMembershipEvent
extends SocketGroupEvent {
    userId: string;
    action: 'joined' | 'removed';
}

@Injectable({
    providedIn: 'root'
})
/**
 * Provides the Angular client-side Socket.IO interface for real-time chat,
 * room presence and live group/user membership updates.
 */
export class SocketService {

    private socket: Socket;

    private readonly serverUrl =
        'http://localhost:3000';


    /**
     * Creates the Socket.IO client but leaves it disconnected until it is needed.
     */
    constructor() {

        this.socket = io(
            this.serverUrl,
            {
                autoConnect: false
            }
        );
    }


    // ==================================================
    // CONNECTION
    // ==================================================

    /**
     * Connects the Socket.IO client when it is not already connected.
     */
    connect(): void {

        if (!this.socket.connected) {
            this.socket.connect();
        }
    }


    /**
     * Disconnects the Socket.IO client when an active connection exists.
     */
    disconnect(): void {

        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }

    /**
     * Subscribes the current socket to user-specific membership updates.
     */
    subscribeToUser(
        userId: string
    ): Promise<SocketActionResult> {

        this.connect();

        return new Promise(
            resolve => {

                this.socket.emit(
                    'subscribeToUser',
                    { userId },
                    (
                        response:
                            SocketActionResult
                    ) => resolve(response)
                );
            }
        );
    }

    /**
     * Stops user-specific real-time updates for the supplied user.
     */
    unsubscribeFromUser(
        userId: string
    ): void {

        this.socket.emit(
            'unsubscribeFromUser',
            { userId }
        );
    }

    /**
     * Returns an Observable that emits when the user's group membership changes.
     */
    onGroupMembershipChanged():
        Observable<SocketGroupMembershipEvent> {

        return new Observable(
            observer => {

                const handler = (
                    event:
                        SocketGroupMembershipEvent
                ) => observer.next(event);

                this.socket.on(
                    'groupMembershipChanged',
                    handler
                );

                return () => this.socket.off(
                    'groupMembershipChanged',
                    handler
                );
            }
        );
    }

    // ==================================================
    // GROUP PAGE UPDATES
    // ==================================================

    /**
     * Subscribes the socket to real-time updates for a specific group.
     */
    subscribeToGroup(
        groupId: string,
        userId: string
    ): Promise<SocketActionResult> {

        this.connect();

        return new Promise(
            resolve => {

                this.socket.emit(
                    'subscribeToGroup',
                    {
                        groupId,
                        userId
                    },
                    (
                        response:
                            SocketActionResult
                    ) => resolve(response)
                );
            }
        );
    }

    /**
     * Stops receiving real-time updates for a specific group.
     */
    unsubscribeFromGroup(
        groupId: string
    ): void {

        this.socket.emit(
            'unsubscribeFromGroup',
            { groupId }
        );
    }

    /**
     * Returns an Observable for live group-member changes.
     */
    onGroupMembersChanged():
        Observable<SocketGroupEvent> {

        return this.onGroupEvent(
            'groupMembersChanged'
        );
    }

    /**
     * Returns an Observable for live group-request changes.
     */
    onGroupRequestsChanged():
        Observable<SocketGroupEvent> {

        return this.onGroupEvent(
            'groupRequestsChanged'
        );
    }

    /**
     * Returns an Observable when the current user's access to a group is revoked.
     */
    onGroupAccessRevoked():
        Observable<SocketGroupAccessRevokedEvent> {

        return new Observable(
            observer => {

                const handler = (
                    event:
                        SocketGroupAccessRevokedEvent
                ) => observer.next(event);

                this.socket.on(
                    'groupAccessRevoked',
                    handler
                );

                return () => this.socket.off(
                    'groupAccessRevoked',
                    handler
                );
            }
        );
    }

    /**
     * Creates a reusable Observable listener for simple group-level Socket.IO events.
     */
    private onGroupEvent(
        eventName: string
    ): Observable<SocketGroupEvent> {

        return new Observable(
            observer => {

                const handler = (
                    event: SocketGroupEvent
                ) => observer.next(event);

                this.socket.on(
                    eventName,
                    handler
                );

                return () => this.socket.off(
                    eventName,
                    handler
                );
            }
        );
    }


    // ==================================================
    // JOIN ROOM
    // ==================================================

    /**
     * Requests to join a Socket.IO chat room after backend validation.
     */
    joinRoom(
        roomId: string,
        userId: string
    ): Promise<SocketActionResult> {

        return new Promise(
            resolve => {

                this.socket.emit(
                    'joinRoom',
                    {
                        roomId,
                        userId
                    },
                    (
                        response:
                            SocketActionResult
                    ) => {

                        resolve(response);
                    }
                );
            }
        );
    }


    // ==================================================
    // LEAVE ROOM
    // ==================================================

    /**
     * Requests to leave the current Socket.IO chat room.
     */
    leaveRoom(
        roomId: string
    ): Promise<SocketActionResult> {

        return new Promise(
            resolve => {

                this.socket.emit(
                    'leaveRoom',
                    {
                        roomId
                    },
                    (
                        response:
                            SocketActionResult
                    ) => {

                        resolve(response);
                    }
                );
            }
        );
    }


    // ==================================================
    // SEND MESSAGE
    // ==================================================

    /**
     * Sends a text or GIF message to the server for validation, persistence and broadcast.
     */
    sendMessage(
        roomId: string,
        senderId: string,
        type: 'text' | 'image' | 'gif',
        content: string
    ): Promise<SocketActionResult> {

        return new Promise(
            resolve => {

                this.socket.emit(
                    'sendMessage',
                    {
                        roomId,
                        senderId,
                        type,
                        content
                    },
                    (
                        response:
                            SocketActionResult
                    ) => {

                        resolve(response);
                    }
                );
            }
        );
    }


    // ==================================================
    // RECEIVE MESSAGE
    // ==================================================

    /**
     * Returns an Observable that emits newly broadcast chat messages.
     */
    onNewMessage():
        Observable<SocketChatMessage> {

        return new Observable(
            observer => {

                const handler =
                    (
                        message:
                            SocketChatMessage
                    ) => {

                        observer.next(
                            message
                        );
                    };


                this.socket.on(
                    'newMessage',
                    handler
                );


                return () => {

                    this.socket.off(
                        'newMessage',
                        handler
                    );
                };
            }
        );
    }


    // ==================================================
    // USER JOINED
    // ==================================================

    /**
     * Returns an Observable for room join notifications.
     */
    onUserJoined():
        Observable<SocketUserEvent> {

        return new Observable(
            observer => {

                const handler =
                    (
                        event:
                            SocketUserEvent
                    ) => {

                        observer.next(
                            event
                        );
                    };


                this.socket.on(
                    'userJoined',
                    handler
                );


                return () => {

                    this.socket.off(
                        'userJoined',
                        handler
                    );
                };
            }
        );
    }


    // ==================================================
    // USER LEFT
    // ==================================================

    /**
     * Returns an Observable for room leave/disconnect notifications.
     */
    onUserLeft():
        Observable<SocketUserEvent> {

        return new Observable(
            observer => {

                const handler =
                    (
                        event:
                            SocketUserEvent
                    ) => {

                        observer.next(
                            event
                        );
                    };


                this.socket.on(
                    'userLeft',
                    handler
                );


                return () => {

                    this.socket.off(
                        'userLeft',
                        handler
                    );
                };
            }
        );
    }


    // ==================================================
    // CURRENT USERS IN ROOM
    // ==================================================

    /**
     * Returns an Observable containing the current deduplicated users in a room.
     */
    onRoomUsersUpdated():
        Observable<SocketRoomUsersEvent> {

        return new Observable(
            observer => {

                const handler =
                    (
                        event:
                            SocketRoomUsersEvent
                    ) => {

                        observer.next(
                            event
                        );
                    };


                this.socket.on(
                    'roomUsersUpdated',
                    handler
                );


                return () => {

                    this.socket.off(
                        'roomUsersUpdated',
                        handler
                    );
                };
            }
        );
    }


    /**
     * Returns an Observable when a chat message is deleted in real time.
     */
    onMessageDeleted() {

    return new Observable<
        SocketMessageDeletedEvent
    >(
        subscriber => {

            const handler = (
                event:
                    SocketMessageDeletedEvent
            ) => {

                subscriber.next(
                    event
                );
            };


            this.socket.on(
                'messageDeleted',
                handler
            );


            return () => {

                this.socket.off(
                    'messageDeleted',
                    handler
                );
            };
        }
    );
  }
}
