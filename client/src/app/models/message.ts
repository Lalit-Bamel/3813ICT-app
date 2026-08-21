export interface Message {

    id: string;

    roomId: string;

    senderId: string;

    type:
        'text' |
        'image' |
        'gif';

    content: string;

    createdAt: string;

    deleted: boolean;

    senderUsername?: string;

    senderIsAdmin?: boolean;
}