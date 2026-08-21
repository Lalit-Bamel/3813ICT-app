export interface AuditLog {

    id: string;

    type: string;

    actorId: string;

    targetId: string | null;

    details: any;

    createdAt: string;

    actorUsername?: string;

    targetUsername?: string | null;
}