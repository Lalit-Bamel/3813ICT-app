import {
    ChangeDetectorRef,
    Component,
    inject,
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
    AuthService
} from '../../services/auth.service';

import {
    RoomService
} from '../../services/room.service';

import {
    GroupService
} from '../../services/group.service';

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
export class ChatRoomComponent
implements OnInit {

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

    private cdr =
        inject(ChangeDetectorRef);


    currentUser =
        this.authService.currentUser;


    room: Room | null = null;

    group: Group | null = null;

    messages: Message[] = [];


    textMessage = '';

    gifUrl = '';


    selectedImage = '';

    selectedImageName = '';


    successMessage = '';

    errorMessage = '';


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


        this.loadGroup(
            groupId
        );

        this.loadRoom(
            roomId,
            groupId
        );

        this.loadMessages(
            roomId
        );
    }


    // ==========================================
    // LOAD GROUP
    // ==========================================

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
    // LOAD ROOM
    // ==========================================

    loadRoom(
        roomId: string,
        groupId: string
    ) {

        this.roomService
            .getRoom(
                roomId
            )
            .subscribe({

                next: room => {

                    // Prevent mismatched URLs such as
                    // Group A URL with Group B room.
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
    // SEND TEXT MESSAGE
    // ==========================================

    sendTextMessage() {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.room
        ) {
            return;
        }


        if (
            !this.textMessage.trim()
        ) {
            return;
        }


        this.errorMessage = '';

        this.successMessage = '';


        this.roomService
            .sendMessage(
                this.room.id,
                user.id,
                'text',
                this.textMessage
            )
            .subscribe({

                next: () => {

                    this.textMessage =
                        '';

                    this.loadMessages();

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to send message.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // IMAGE SELECTION
    // ==========================================

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


        if (
            !file.type.startsWith(
                'image/'
            )
        ) {

            this.errorMessage =
                'Please select an image file.';

            input.value = '';

            this.cdr.markForCheck();

            return;
        }


        const reader =
            new FileReader();


        reader.onload = () => {

            this.selectedImage =
                reader.result as string;

            this.selectedImageName =
                file.name;

            input.value = '';

            this.cdr.markForCheck();
        };


        reader.onerror = () => {

            this.errorMessage =
                'Unable to read image file.';

            input.value = '';

            this.cdr.markForCheck();
        };


        reader.readAsDataURL(
            file
        );
    }


    // ==========================================
    // SEND IMAGE
    // ==========================================

    sendImage() {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.room ||
            !this.selectedImage
        ) {
            return;
        }


        this.errorMessage = '';

        this.successMessage = '';


        this.roomService
            .sendMessage(
                this.room.id,
                user.id,
                'image',
                this.selectedImage
            )
            .subscribe({

                next: () => {

                    this.selectedImage =
                        '';

                    this.selectedImageName =
                        '';

                    this.loadMessages();

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to send image.';

                    this.cdr.markForCheck();
                }
            });
    }


    cancelImage() {

        this.selectedImage =
            '';

        this.selectedImageName =
            '';

        this.cdr.markForCheck();
    }


    // ==========================================
    // SEND GIF
    // ==========================================

    sendGif() {

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


        this.roomService
            .sendMessage(
                this.room.id,
                user.id,
                'gif',
                this.gifUrl
            )
            .subscribe({

                next: () => {

                    this.gifUrl =
                        '';

                    this.loadMessages();

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to send GIF.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // CHECK MESSAGE OWNERSHIP
    // ==========================================

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
    // DELETE OWN MESSAGE
    // ==========================================

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


        this.roomService
            .deleteMessage(
                this.room.id,
                message.id,
                user.id
            )
            .subscribe({

                next: () => {

                    this.loadMessages();

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