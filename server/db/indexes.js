/**
 * Creates the MongoDB indexes used by Fabulari.
 *
 * Indexes improve common query performance and
 * enforce uniqueness for application identifiers.
 */
async function createIndexes(db) {

    // ==========================================
    // USERS
    // ==========================================

    const usersCollection =
        db.collection("users");


    await usersCollection.createIndex(
        {
            id: 1
        },
        {
            unique: true,
            name: "unique_user_id"
        }
    );


    await usersCollection.createIndex(
        {
            email: 1
        },
        {
            unique: true,
            name: "unique_user_email"
        }
    );


    await usersCollection.createIndex(
        {
            username: 1
        },
        {
            unique: true,

            name:
                "unique_username_case_insensitive",

            collation: {
                locale: "en",
                strength: 2
            }
        }
    );


    // ==========================================
    // GROUPS
    // ==========================================

    const groupsCollection =
        db.collection("groups");


    await groupsCollection.createIndex(
        {
            id: 1
        },
        {
            unique: true,
            name: "unique_group_id"
        }
    );


    // ==========================================
    // ROOMS
    // ==========================================

    const roomsCollection =
        db.collection("rooms");


    await roomsCollection.createIndex(
        {
            id: 1
        },
        {
            unique: true,
            name: "unique_room_id"
        }
    );


    await roomsCollection.createIndex(
        {
            groupId: 1
        },
        {
            name:
                "rooms_by_group"
        }
    );


    // ==========================================
    // REQUESTS
    // ==========================================

    const requestsCollection =
        db.collection("requests");


    await requestsCollection.createIndex(
        {
            id: 1
        },
        {
            unique: true,
            name: "unique_request_id"
        }
    );


    await requestsCollection.createIndex(
        {
            requesterId: 1,
            createdAt: -1
        },
        {
            name:
                "requests_by_user_history"
        }
    );


    await requestsCollection.createIndex(
        {
            type: 1,
            status: 1,
            targetGroupId: 1
        },
        {
            name:
                "pending_requests_by_type_group"
        }
    );


    // ==========================================
    // MESSAGES
    // ==========================================

    const messagesCollection =
        db.collection("messages");


    await messagesCollection.createIndex(
        {
            id: 1
        },
        {
            unique: true,
            name: "unique_message_id"
        }
    );


    await messagesCollection.createIndex(
        {
            roomId: 1,
            createdAt: -1
        },
        {
            name:
                "messages_by_room_date"
        }
    );


    // ==========================================
    // AUDIT LOGS
    // ==========================================

    const auditLogsCollection =
        db.collection("auditLogs");


    await auditLogsCollection.createIndex(
        {
            id: 1
        },
        {
            unique: true,
            name: "unique_audit_log_id"
        }
    );


    await auditLogsCollection.createIndex(
        {
            createdAt: -1
        },
        {
            name:
                "audit_logs_by_date"
        }
    );


    // ==========================================
    // BANNED USERS
    // ==========================================

    const bannedUsersCollection =
        db.collection("bannedUsers");


    await bannedUsersCollection.createIndex(
        {
            id: 1
        },
        {
            unique: true,
            name: "unique_banned_user_id"
        }
    );


    await bannedUsersCollection.createIndex(
        {
            originalUserId: 1
        },
        {
            unique: true,
            name:
                "unique_original_banned_user"
        }
    );


    // ==========================================
    // APPLICATION STATE
    // ==========================================

    const appStateCollection =
        db.collection("appState");


    await appStateCollection.createIndex(
        {
            key: 1
        },
        {
            unique: true,
            name:
                "unique_app_state_key"
        }
    );


    console.log(
        "MongoDB indexes ready."
    );
}


module.exports = {
    createIndexes
};