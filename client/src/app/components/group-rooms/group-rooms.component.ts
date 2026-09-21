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
    GroupService
} from '../../services/group.service';

import {
    RoomService
} from '../../services/room.service';

import {
    RequestService
} from '../../services/request.service';
import {
    SocketService
} from '../../services/socket.service';

import {
    Group,
    GroupMember
} from '../../models/group';

import {
    Room
} from '../../models/room';

import {
    NavbarComponent
} from '../navbar/navbar.component';


@Component({
    selector: 'app-group-rooms',

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        NavbarComponent
    ],

    templateUrl:
        './group-rooms.component.html',

    styleUrl:
        './group-rooms.component.css'
})
export class GroupRoomsComponent
implements OnInit, OnDestroy {

    private route =
        inject(ActivatedRoute);
    private router =
        inject(Router);

    private authService =
        inject(AuthService);

    private groupService =
        inject(GroupService);

    private roomService =
        inject(RoomService);

    private requestService =
        inject(RequestService);
    private socketService =
        inject(SocketService);

    private cdr =
        inject(ChangeDetectorRef);
    private groupSubscriptions:
        Subscription[] = [];


    currentUser =
        this.authService.currentUser;


    group: Group | null = null;

    rooms: Room[] = [];

    members: GroupMember[] = [];


    // DIRECT ROOM CREATION

    newRoomName = '';


    // ROOM PROPOSAL

    proposedRoomName = '';


    // ROOM RENAME

    renamingRoomId:
        string | null = null;

    renameRoomName = '';


    // GROUP BAN REQUEST

    groupBanTargetId:
        string | null = null;

    groupBanReason = '';
    groupBanError = '';
    leaveError = '';
    pageError = '';
    createRoomError = '';
    proposeRoomError = '';
    renameErrors:
        Record<string, string> = {};
    deleteErrors:
        Record<string, string> = {};


    successMessage = '';

    ngOnInit() {

        const groupId =
            this.route.snapshot
                .paramMap
                .get('groupId');


        if (!groupId) {
            return;
        }


        this.loadGroup(
            groupId
        );

        this.loadRooms(
            groupId
        );

        this.loadMembers(
            groupId
        );

        this.subscribeToGroupUpdates(
            groupId
        );
    }

    ngOnDestroy() {

        for (
            const subscription
            of this.groupSubscriptions
        ) {
            subscription.unsubscribe();
        }

        if (this.group) {
            this.socketService
                .unsubscribeFromGroup(
                    this.group.id
                );
        }
    }

    private subscribeToGroupUpdates(
        groupId: string
    ) {

        const user = this.currentUser();

        if (!user) {
            return;
        }

        this.socketService
            .subscribeToGroup(
                groupId,
                user.id
            );

        this.groupSubscriptions.push(
            this.socketService
                .onGroupMembersChanged()
                .subscribe(event => {

                    if (event.groupId === groupId) {
                        this.loadGroup(groupId);
                        this.loadMembers(groupId);
                    }
                }),

            this.socketService
                .onGroupAccessRevoked()
                .subscribe(event => {

                    if (
                        event.groupId === groupId &&
                        event.userId === user.id
                    ) {
                        this.router.navigate([
                            '/groups'
                        ]);
                    }
                })
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

                    this.pageError =
                        error.error?.message ||
                        'Unable to load group.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // LOAD ROOMS
    // ==========================================

    loadRooms(
        groupId: string
    ) {

        this.roomService
            .getRooms(
                groupId
            )
            .subscribe({

                next: rooms => {

                    this.rooms =
                        rooms;

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.pageError =
                        error.error?.message ||
                        'Unable to load rooms.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // LOAD MEMBERS
    // ==========================================

    loadMembers(
        groupId: string
    ) {

        this.groupService
            .getGroupMembers(
                groupId
            )
            .subscribe({

                next: members => {

                    this.members =
                        members;

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.pageError =
                        error.error?.message ||
                        'Unable to load group members.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // CHECK GROUP ADMIN
    // ==========================================

    isGroupAdmin(): boolean {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.group
        ) {
            return false;
        }


        return this.group
            .adminIds
            .includes(
                user.id
            );
    }


    isMemberAdmin(
        member: GroupMember
    ): boolean {

        return (
            this.group?.adminIds
                .includes(
                    member.id
                )
            ?? false
        );
    }


    // ==========================================
    // ADMIN DIRECT CREATE ROOM
    // ==========================================

    createRoom() {

        const user =
            this.currentUser();


        if (!user || !this.group) {
            return;
        }


        if (!this.newRoomName.trim()) {
            this.createRoomError =
                'Please enter a room name.';

            this.cdr.markForCheck();

            return;
        }


        this.createRoomError = '';

        this.successMessage = '';


        this.roomService
            .createRoom(
                this.group.id,
                user.id,
                this.newRoomName
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'Room created successfully.';

                    this.newRoomName =
                        '';

                    this.loadRooms(
                        this.group!.id
                    );

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.createRoomError =
                        error.error?.message ||
                        'Unable to create room.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // MEMBER PROPOSE ROOM
    // ==========================================

    proposeRoom() {

        const user =
            this.currentUser();


        if (!user || !this.group) {
            return;
        }


        if (!this.proposedRoomName.trim()) {
            this.proposeRoomError =
                'Please enter a room name.';

            this.cdr.markForCheck();

            return;
        }


        this.proposeRoomError = '';

        this.successMessage = '';


        this.requestService
            .createRoomRequest(
                user.id,
                this.group.id,
                this.proposedRoomName
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'Room proposal submitted to the Group Administrator.';

                    this.proposedRoomName =
                        '';

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.proposeRoomError =
                        error.error?.message ||
                        'Unable to submit room proposal.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // START ROOM RENAME
    // ==========================================

    startRename(
        room: Room
    ) {

        this.renamingRoomId =
            room.id;

        this.renameRoomName =
            room.name;

        delete this.renameErrors[
            room.id
        ];

        this.successMessage = '';

        this.cdr.markForCheck();
    }


    cancelRename() {

        this.renamingRoomId =
            null;

        this.renameRoomName =
            '';

        this.cdr.markForCheck();
    }


    // ==========================================
    // CONFIRM ROOM RENAME
    // ==========================================

    confirmRename(
        room: Room
    ) {

        const user =
            this.currentUser();


        if (!user) {
            return;
        }


        if (!this.renameRoomName.trim()) {
            this.renameErrors[
                room.id
            ] = 'Please enter a room name.';

            this.cdr.markForCheck();

            return;
        }


        delete this.renameErrors[
            room.id
        ];

        this.successMessage = '';


        this.roomService
            .renameRoom(
                room.id,
                user.id,
                this.renameRoomName
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'Room renamed successfully.';

                    this.renamingRoomId =
                        null;

                    this.renameRoomName =
                        '';

                    if (this.group) {

                        this.loadRooms(
                            this.group.id
                        );
                    }


                    this.cdr.markForCheck();
                },

                error: error => {

                    this.renameErrors[
                        room.id
                    ] =
                        error.error?.message ||
                        'Unable to rename room.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // DELETE ROOM
    // ==========================================

    deleteRoom(
        room: Room
    ) {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.group
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete room "${room.name}"?`
            );


        if (!confirmed) {
            return;
        }


        delete this.deleteErrors[
            room.id
        ];

        this.successMessage = '';


        this.roomService
            .deleteRoom(
                room.id,
                user.id
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'Room deleted successfully.';

                    this.loadRooms(
                        this.group!.id
                    );

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.deleteErrors[
                        room.id
                    ] =
                        error.error?.message ||
                        'Unable to delete room.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // START GROUP BAN REQUEST
    // ==========================================

    startGroupBan(
        member: GroupMember
    ) {

        this.groupBanTargetId =
            member.id;

        this.groupBanReason =
            '';

        this.groupBanError = '';

        this.successMessage =
            '';

        this.cdr.markForCheck();
    }


    // ==========================================
    // CANCEL GROUP BAN REQUEST
    // ==========================================

    cancelGroupBan() {

        this.groupBanTargetId =
            null;

        this.groupBanReason =
            '';

        this.groupBanError = '';

        this.cdr.markForCheck();
    }


    // ==========================================
    // SUBMIT GROUP BAN REQUEST
    // ==========================================

    confirmGroupBan(
        member: GroupMember
    ) {

        const user =
            this.currentUser();


        if (
            !user ||
            !this.group
        ) {
            return;
        }


        if (
            !this.groupBanReason
                .trim()
        ) {

            this.groupBanError =
                'Please enter a reason for the ban request.';

            this.cdr.markForCheck();

            return;
        }


        this.groupBanError = '';

        this.successMessage =
            '';


        this.requestService
            .createGroupBanRequest(
                user.id,
                this.group.id,
                member.id,
                this.groupBanReason
            )
            .subscribe({

                next: () => {

                    this.successMessage =
                        'Group ban request submitted to the Group Administrator.';

                    this.groupBanTargetId =
                        null;

                    this.groupBanReason =
                        '';

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.groupBanError =
                        error.error?.message ||
                        'Unable to submit group ban request.';

                    this.cdr.markForCheck();
                }
            });
    }


    // ==========================================
    // LEAVE GROUP
    // ==========================================

    leaveGroup() {

        const user = this.currentUser();

        if (!user || !this.group) {
            return;
        }

        if (!window.confirm(
            `Leave ${this.group.title}?`
        )) {
            return;
        }

        this.leaveError = '';

        this.groupService
            .leaveGroup(
                this.group.id,
                user.id
            )
            .subscribe({

                next: () => {
                    this.router.navigate([
                        '/groups'
                    ]);
                },

                error: error => {
                    this.leaveError =
                        error.error?.message ||
                        'Unable to leave group.';

                    this.cdr.markForCheck();
                }
            });
    }
}
