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