import {
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';

import {
    ActivatedRoute,
    Router,
    RouterLink
} from '@angular/router';

import {
    Subscription
} from 'rxjs';

import {
    AuthService
} from '../../services/auth.service';

import {
    RoomService
} from '../../services/room.service';

import {
    GroupService
} from '../../services/group.service';

import {
    SocketRoomUser,
    SocketService
} from '../../services/socket.service';

import {
    Room
} from '../../models/room';

import {
    Group
} from '../../models/group';

import {
    Message
} from '../../models/message';

import {
    NavbarComponent
} from '../navbar/navbar.component';


@Component({
    selector: 'app-chat-room',

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        NavbarComponent
    ],

    templateUrl:
        './chat-room.component.html',

    styleUrl:
        './chat-room.component.css'
})
/**
 * Controls the real-time chat-room screen, including message history, Socket.IO events, presence, image/GIF sending and message deletion.
 */
export class ChatRoomComponent
implements OnInit, OnDestroy {

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private authService =
        inject(AuthService);

    private roomService =
        inject(RoomService);

    private groupService =
        inject(GroupService);

    private socketService =
        inject(SocketService);

    private cdr =
        inject(ChangeDetectorRef);


    private socketSubscriptions:
        Subscription[] = [];


    currentUser =
        this.authService.currentUser;


    room: Room | null = null;

    group: Group | null = null;

    messages: Message[] = [];

    onlineUsers: SocketRoomUser[] = [];


    textMessage = '';

    gifUrl = '';


    selectedImage = '';

    selectedImageName = '';

    selectedImageFile:
        File | null = null;


    successMessage = '';

    errorMessage = '';

    presenceMessage = '';


    // ==========================================
    // INITIALISE
    // ==========================================

    /**
     * Initialises the selected group/room, current user, existing messages and real-time Socket.IO listeners.
     */
    ngOnInit() {

        const groupId =
            this.route.snapshot
                .paramMap
                .get('groupId');


        const roomId =
            this.route.snapshot
                .paramMap
                .get('roomId');


        if (
            !groupId ||
            !roomId
        ) {

            this.router.navigate([
                '/groups'
            ]);

            return;
        }


        /*
         * Connect to the Socket.IO server
         * when the chat room component opens.
         */
        this.socketService.connect();


        /*
         * Start listening for live Socket.IO
         * events before joining the room.
         */
        this.listenForSocketEvents();


        this.loadGroup(
            groupId
        );


        this.loadRoom(
            roomId,
            groupId
        );


        /*
         * Initial message history is loaded
         * through REST.
         *
         * New messages are received live
         * through Socket.IO.
         */
        this.loadMessages(
            roomId
        );
    }


    // ==========================================
    // CLEAN UP
    // ==========================================

    /**
     * Unsubscribes from observables and leaves the Socket.IO room when the component is destroyed.
     */
    ngOnDestroy() {

        /*
         * Tell the Socket.IO server that this
         * user is leaving the current room.
         */
        if (this.room) {

            this.socketService
                .leaveRoom(
                    this.room.id
                )
                .catch(() => {

                    /*
                     * Component is closing,
                     * so no UI action is required.
                     */
                });
        }


        /*
         * Remove all RxJS Socket.IO
         * subscriptions.
         */
        for (
            const subscription
            of this.socketSubscriptions
        ) {

            subscription.unsubscribe();
        }


        /*
         * Disconnect this client from
         * Socket.IO.
         */
        this.socketService.disconnect();
    }


    // ==========================================
    // SOCKET LISTENERS
    // ==========================================

    /**
     * Registers listeners for new messages, message deletion, presence updates and join/leave notifications.
     */
    private listenForSocketEvents() {

        // ------------------------------------------
        // NEW MESSAGE
        // ------------------------------------------

        const messageSubscription =
            this.socketService
                .onNewMessage()
                .subscribe(
                    socketMessage => {

                        if (
                            !this.room ||
                            socketMessage.roomId !==
                                this.room.id
                        ) {
                            return;
                        }


                        const message:
                            Message =
                            socketMessage;


                        /*
                         * Add the new live message
                         * and keep only the newest
                         * five messages.
                         */
                        this.messages = [
                            ...this.messages,
                            message
                        ].slice(-5);


                        this.cdr.markForCheck();
                    }
                );


        // ------------------------------------------
        // USER JOINED
        // ------------------------------------------

        const joinedSubscription =
            this.socketService
                .onUserJoined()
                .subscribe(
                    event => {

                        if (
                            !this.room ||
                            event.roomId !==
                                this.room.id
                        ) {
                            return;
                        }


                        this.presenceMessage =
                            `${event.username} joined the room.`;


                        this.cdr.markForCheck();
                    }
                );


        // ------------------------------------------
        // USER LEFT
        // ------------------------------------------

        const leftSubscription =
            this.socketService
                .onUserLeft()
                .subscribe(
                    event => {

                        if (
                            !this.room ||
                            event.roomId !==
                                this.room.id
                        ) {
                            return;
                        }


                        this.presenceMessage =
                            `${event.username} left the room.`;


                        this.cdr.markForCheck();
                    }
                );


        // ------------------------------------------
        // CURRENT USERS IN ROOM
        // ------------------------------------------

        const roomUsersSubscription =
            this.socketService
                .onRoomUsersUpdated()
                .subscribe(
                    event => {

                        if (
                            !this.room ||
                            event.roomId !==
                                this.room.id
                        ) {
                            return;
                        }


                        this.onlineUsers =
                            event.users;


                        this.cdr.markForCheck();
                    }
                );


        // ------------------------------------------
        // MESSAGE DELETED
        // ------------------------------------------

        const deletedSubscription =
            this.socketService
                .onMessageDeleted()
                .subscribe(
                    event => {

                        /*
                         * Ignore deletion events
                         * belonging to another room.
                         */
                        if (
                            !this.room ||
                            event.roomId !==
                                this.room.id
                        ) {
                            return;
                        }


                        /*
                         * Remove the deleted message
                         * from this client's local
                         * message array immediately.
                         *
                         * Every connected client in
                         * the room receives this same
                         * Socket.IO event.
                         */
                        this.messages =
                            this.messages.filter(
                                message =>
                                    message.id !==
                                    event.messageId
                            );


                        this.cdr.markForCheck();
                    }
                );


        /*
         * Store every subscription so they
         * can be cleaned up in ngOnDestroy().
         */
        this.socketSubscriptions.push(
            messageSubscription,
            joinedSubscription,
            leftSubscription,
            roomUsersSubscription,
            deletedSubscription
        );
    }


    // ==========================================
    // LOAD GROUP
    // ==========================================

    /**
     * Loads the parent group and verifies that the current user still has access.
     */
    loadGroup(
        groupId: string
    ) {

        this.groupService
            .getGroup(
                groupId
            )
            .subscribe({

                next: group => {

                    this.group =
                        group;


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load group.';


                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // LOAD ROOM + JOIN SOCKET ROOM
    // ==========================================

    /**
     * Loads the selected room and verifies that it belongs to the current group.
     */
    loadRoom(
        roomId: string,
        groupId: string
    ) {

        this.roomService
            .getRoom(
                roomId
            )
            .subscribe({

                next: async room => {

                    /*
                     * Protect against a room URL
                     * containing the wrong group ID.
                     */
                    if (
                        room.groupId !==
                        groupId
                    ) {

                        this.router.navigate([
                            '/groups'
                        ]);

                        return;
                    }


                    this.room =
                        room;


                    const user =
                        this.currentUser();


                    if (!user) {
                        return;
                    }


                    /*
                     * Ask the Socket.IO server
                     * to join this room.
                     *
                     * The server performs its own
                     * membership/authorization
                     * validation.
                     */
                    const result =
                        await this.socketService
                            .joinRoom(
                                room.id,
                                user.id
                            );


                    if (!result.success) {

                        this.errorMessage =
                            result.message;

                    } else {

                        this.errorMessage =
                            '';
                    }


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load room.';


                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // LOAD LAST 5 MESSAGES
    // ==========================================

    /**
     * Loads the most recent non-deleted messages for the current room.
     */
    loadMessages(
        roomId?: string
    ) {

        const user =
            this.currentUser();


        const selectedRoomId =
            roomId ||
            this.room?.id;


        if (
            !user ||
            !selectedRoomId
        ) {
            return;
        }


        this.roomService
            .getMessages(
                selectedRoomId,
                user.id
            )
            .subscribe({

                next: messages => {

                    this.messages =
                        messages;


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load messages.';


                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // SEND TEXT MESSAGE USING SOCKET.IO
    // ==========================================

    /**
     * Validates and sends a text message through Socket.IO for persistence and real-time broadcast.
     */
    async sendTextMessage() {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.room
        ) {
            return;
        }


        const content =
            this.textMessage.trim();


        if (!content) {
            return;
        }


        this.errorMessage = '';

        this.successMessage = '';


        const result =
            await this.socketService
                .sendMessage(
                    this.room.id,
                    user.id,
                    'text',
                    content
                );


        if (!result.success) {

            this.errorMessage =
                result.message;


            this.cdr.markForCheck();

            return;
        }


        /*
         * Do NOT manually add the message here.
         *
         * The server saves it to MongoDB and
         * broadcasts newMessage back to everyone
         * in this Socket.IO room, including
         * the sender.
         */
        this.textMessage = '';


        this.cdr.markForCheck();
    }


    // ==========================================
    // IMAGE SELECTION
    // ==========================================

    /**
     * Validates a selected image and creates a local preview before upload.
     */
    onImageSelected(
        event: Event
    ) {

        const input =
            event.target as
                HTMLInputElement;


        const file =
            input.files?.[0];


        if (!file) {
            return;
        }


        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            this.errorMessage =
                'Please select a JPG, PNG, GIF or WEBP image.';


            input.value = '';


            this.cdr.markForCheck();

            return;
        }


        if (
            file.size >
            5 * 1024 * 1024
        ) {

            this.errorMessage =
                'Image must be 5 MB or smaller.';


            input.value = '';


            this.cdr.markForCheck();

            return;
        }


        this.selectedImageFile =
            file;


        this.selectedImageName =
            file.name;


        const reader =
            new FileReader();


        reader.onload = () => {

            /*
             * Base64 is used ONLY for the
             * browser preview.
             *
             * The Base64 string is never sent
             * to MongoDB.
             */
            this.selectedImage =
                reader.result as string;


            this.cdr.markForCheck();
        };


        reader.onerror = () => {

            this.errorMessage =
                'Unable to preview image.';


            this.selectedImageFile =
                null;


            this.selectedImage =
                '';


            this.selectedImageName =
                '';


            this.cdr.markForCheck();
        };


        reader.readAsDataURL(
            file
        );


        /*
         * Clear the file input so the same
         * file could be selected again later.
         */
        input.value = '';
    }


    // ==========================================
    // SEND IMAGE
    // ==========================================

    /**
     * Uploads the selected chat image and adds the server-created message to the room in real time.
     */
    sendImage() {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.room ||
            !this.selectedImageFile
        ) {
            return;
        }


        this.errorMessage = '';

        this.successMessage = '';


        /*
         * Image binary is uploaded through HTTP.
         *
         * The backend stores the actual file on
         * disk, stores its reference/metadata in
         * MongoDB, then broadcasts newMessage
         * through Socket.IO.
         */
        this.roomService
            .uploadChatImage(
                this.room.id,
                user.id,
                this.selectedImageFile
            )
            .subscribe({

                next: () => {

                    /*
                     * Do NOT manually add the image
                     * to messages.
                     *
                     * Backend broadcasts newMessage
                     * after the image message has
                     * been persisted.
                     */
                    this.selectedImageFile =
                        null;


                    this.selectedImage =
                        '';


                    this.selectedImageName =
                        '';


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to upload image.';


                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // CANCEL IMAGE
    // ==========================================

    /**
     * Clears the selected image and preview without sending it.
     */
    cancelImage() {

        this.selectedImageFile =
            null;


        this.selectedImage =
            '';


        this.selectedImageName =
            '';


        this.cdr.markForCheck();
    }


    // ==========================================
    // SEND GIF USING SOCKET.IO
    // ==========================================

    /**
     * Validates a GIF URL and sends it through the same Socket.IO message flow as text.
     */
    async sendGif() {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.room ||
            !this.gifUrl.trim()
        ) {
            return;
        }


        this.errorMessage = '';

        this.successMessage = '';


        const result =
            await this.socketService
                .sendMessage(
                    this.room.id,
                    user.id,
                    'gif',
                    this.gifUrl.trim()
                );


        if (!result.success) {

            this.errorMessage =
                result.message;


            this.cdr.markForCheck();

            return;
        }


        /*
         * Like text messages, the server
         * broadcasts the saved GIF message
         * back through newMessage.
         */
        this.gifUrl = '';


        this.cdr.markForCheck();
    }


    // ==========================================
    // CHECK MESSAGE OWNERSHIP
    // ==========================================

    /**
     * Returns whether the supplied message belongs to the currently logged-in user.
     */
    isOwnMessage(
        message: Message
    ): boolean {

        const user =
            this.currentUser();


        if (!user) {
            return false;
        }


        return (
            message.senderId ===
            user.id
        );
    }


    // ==========================================
    // BUILD IMAGE URL
    // ==========================================

    /**
     * Builds the display URL for uploaded images while preserving local/Base64 previews when needed.
     */
    getImageUrl(
        content: string
    ): string {

        /*
         * Existing HTTP URLs, HTTPS URLs and
         * old/local Base64 previews can be used
         * directly.
         */
        if (
            content.startsWith(
                'http://'
            ) ||
            content.startsWith(
                'https://'
            ) ||
            content.startsWith(
                'data:'
            )
        ) {
            return content;
        }


        /*
         * Stored server paths such as:
         *
         * /uploads/chat/abc.jpg
         * /uploads/profiles/xyz.png
         *
         * are served by the Node server.
         */
        return (
            'http://localhost:3000' +
            content
        );
    }


    // ==========================================
    // DELETE OWN MESSAGE
    // ==========================================

    /**
     * Soft-deletes one of the current user's own messages and relies on Socket.IO to update connected clients.
     */
    deleteMessage(
        message: Message
    ) {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.room
        ) {
            return;
        }


        /*
         * Client-side ownership check.
         *
         * Backend must still perform its own
         * authorization check.
         */
        if (
            !this.isOwnMessage(
                message
            )
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                'Delete this message?'
            );


        if (!confirmed) {
            return;
        }


        this.errorMessage = '';

        this.successMessage = '';


        this.roomService
            .deleteMessage(
                this.room.id,
                message.id,
                user.id
            )
            .subscribe({

                next: () => {

                    /*
                     * IMPORTANT:
                     *
                     * Do NOT call loadMessages()
                     * here anymore.
                     *
                     * The backend emits the
                     * messageDeleted Socket.IO
                     * event after MongoDB has
                     * marked the message deleted.
                     *
                     * Every user in the room,
                     * including this sender,
                     * receives that event and
                     * removes the message locally.
                     */
                    this.successMessage =
                        'Message deleted successfully.';


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to delete message.';


                    this.cdr.markForCheck();
                }
            });
    }
}
