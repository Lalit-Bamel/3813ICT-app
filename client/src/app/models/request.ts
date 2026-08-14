export interface Request {

    id: string;

    type: string;

    requesterId: string;

    requesterUsername?: string;

    targetGroupId: string | null;

    targetUserId: string | null;

    details: any;

    reason: string | null;

    status:
        'pending' |
        'approved' |
        'rejected';

    rejectionReason: string | null;

    createdAt: string;
}