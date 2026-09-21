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
export class SocketService {

    private socket: Socket;

    private readonly serverUrl =
        'http://localhost:3000';


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

    connect(): void {

        if (!this.socket.connected) {
            this.socket.connect();
        }
    }


    disconnect(): void {

        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }

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

    unsubscribeFromUser(
        userId: string
    ): void {

        this.socket.emit(
            'unsubscribeFromUser',
            { userId }
        );
    }

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

    unsubscribeFromGroup(
        groupId: string
    ): void {

        this.socket.emit(
            'unsubscribeFromGroup',
            { groupId }
        );
    }

    onGroupMembersChanged():
        Observable<SocketGroupEvent> {

        return this.onGroupEvent(
            'groupMembersChanged'
        );
    }

    onGroupRequestsChanged():
        Observable<SocketGroupEvent> {

        return this.onGroupEvent(
            'groupRequestsChanged'
        );
    }

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
