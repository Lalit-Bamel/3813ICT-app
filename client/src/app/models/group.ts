export interface Group {

    id: string;

    title: string;

    description: string;

    minimumAge: number;

    theme: string;

    adminIds: string[];

    memberIds: string[];

    bannedUserIds: string[];

    roomIds: string[];

    createdAt: string;
}