import {
    ChangeDetectorRef,
    Component,
    inject,
    OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';
import { RoomService } from '../../services/room.service';
import { RequestService } from '../../services/request.service';

import { Group,
         GroupMember} from '../../models/group';
import { Room } from '../../models/room';

import { NavbarComponent } from '../navbar/navbar.component';


@Component({
    selector: 'app-group-rooms',

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        NavbarComponent
    ],

    templateUrl: './group-rooms.component.html',
    styleUrl: './group-rooms.component.css'
})
export class GroupRoomsComponent implements OnInit {

    private route = inject(ActivatedRoute);
    private authService = inject(AuthService);
    private groupService = inject(GroupService);
    private roomService = inject(RoomService);
    private requestService = inject(RequestService);
    private cdr = inject(ChangeDetectorRef);


    currentUser = this.authService.currentUser;

    group: Group | null = null;

    rooms: Room[] = [];


    newRoomName = '';

    proposedRoomName = '';


    editingRoomId: string | null = null;

    editedRoomName = '';


    successMessage = '';

    errorMessage = '';

    members: GroupMember[] = [];

loadMembers(groupId: string) {

    this.groupService
        .getGroupMembers(groupId)
        .subscribe({

            next: members => {

                this.members =
                    members;

                this.cdr.markForCheck();
            },

            error: error => {

                this.errorMessage =
                    error.error?.message ||
                    'Unable to load members.';

                this.cdr.markForCheck();
            }
        });
}

    ngOnInit() {

        const groupId =
            this.route.snapshot.paramMap.get('groupId');

        if (!groupId) {
            return;
        }

        this.loadGroup(groupId);
        this.loadRooms(groupId);
        this.loadMembers(groupId);
    }

    requestGroupBan(
    member: GroupMember
) {

    const user =
        this.currentUser();


    if (!user || !this.group) {
        return;
    }


    const reason = window.prompt(
        `Why should ${member.username} be banned from this group?`
    );


    if (!reason?.trim()) {
        return;
    }


    this.requestService
        .createGroupBanRequest(
            user.id,
            this.group.id,
            member.id,
            reason
        )
        .subscribe({

            next: () => {

                this.successMessage =
                    'Group ban request submitted.';

                this.cdr.markForCheck();
            },

            error: error => {

                this.errorMessage =
                    error.error?.message ||
                    'Unable to submit ban request.';

                this.cdr.markForCheck();
            }
        });
}

    loadGroup(groupId: string) {

        this.groupService
            .getGroup(groupId)
            .subscribe({

                next: group => {

                    this.group = group;

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


    loadRooms(groupId: string) {

        this.roomService
            .getRooms(groupId)
            .subscribe({

                next: rooms => {

                    this.rooms = rooms;

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to load rooms.';

                    this.cdr.markForCheck();
                }
            });
    }


    get isAdmin(): boolean {

        const user = this.currentUser();

        if (!user || !this.group) {
            return false;
        }

        return this.group.adminIds.includes(user.id);
    }


    createRoom() {

        const user = this.currentUser();

        if (
            !user ||
            !this.group ||
            !this.newRoomName.trim()
        ) {
            return;
        }


        this.errorMessage = '';
        this.successMessage = '';


        this.roomService
            .createRoom(
                this.group.id,
                user.id,
                this.newRoomName
            )
            .subscribe({

                next: () => {

                    this.newRoomName = '';

                    this.successMessage =
                        'Room created successfully.';

                    this.loadRooms(this.group!.id);

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to create room.';

                    this.cdr.markForCheck();
                }
            });
    }


    proposeRoom() {

        const user = this.currentUser();

        if (
            !user ||
            !this.group ||
            !this.proposedRoomName.trim()
        ) {
            return;
        }


        this.errorMessage = '';
        this.successMessage = '';


        this.requestService
            .createRoomRequest(
                user.id,
                this.group.id,
                this.proposedRoomName
            )
            .subscribe({

                next: () => {

                    this.proposedRoomName = '';

                    this.successMessage =
                        'Room proposal submitted.';

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to submit room proposal.';

                    this.cdr.markForCheck();
                }
            });
    }


    renameRoom(room: Room) {

        this.errorMessage = '';
        this.successMessage = '';

        this.editingRoomId = room.id;

        this.editedRoomName = room.name;
    }


    cancelRename() {

        this.editingRoomId = null;

        this.editedRoomName = '';
    }


    saveRoomName(room: Room) {

        const user = this.currentUser();

        if (
            !user ||
            !this.editedRoomName.trim()
        ) {
            return;
        }


        this.errorMessage = '';
        this.successMessage = '';


        this.roomService
            .renameRoom(
                room.id,
                user.id,
                this.editedRoomName
            )
            .subscribe({

                next: () => {

                    this.editingRoomId = null;

                    this.editedRoomName = '';

                    this.successMessage =
                        'Room renamed successfully.';

                    this.loadRooms(room.groupId);

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to rename room.';

                    this.cdr.markForCheck();
                }
            });
    }


    deleteRoom(room: Room) {

        const user = this.currentUser();

        if (!user) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete room "${room.name}"?`
            );


        if (!confirmed) {
            return;
        }


        this.errorMessage = '';
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

                    this.loadRooms(room.groupId);

                    this.cdr.markForCheck();
                },

                error: error => {

                    this.errorMessage =
                        error.error?.message ||
                        'Unable to delete room.';

                    this.cdr.markForCheck();
                }
            });
    }
}