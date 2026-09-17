const express = require("express");

const { getDb } = require("../db/mongo");

const router = express.Router();

/**
 * Finds a Super Administrator by application user ID.
 */
async function getSuperAdmin(
    usersCollection,
    userId
) {

    return usersCollection.findOne({
        id: userId,
        systemRole: "superAdmin"
    });
}


// ==================================================
// PERMANENTLY BANNED USERS
// ==================================================

router.get(
    "/banned-users/:userId",
    async function (req, res) {

        try {

            const db =
                getDb();

            const usersCollection =
                db.collection("users");

            const bannedUsersCollection =
                db.collection("bannedUsers");

            const superAdmin =
                await getSuperAdmin(
                    usersCollection,
                    req.params.userId
                );

            if (!superAdmin) {
                return res.status(403).json({
                    message:
                        "Access denied."
                });
            }

            const bannedUsers =
                await bannedUsersCollection
                    .find(
                        {},
                        {
                            projection: {
                                _id: 0
                            }
                        }
                    )
                    .toArray();

            return res.json(
                bannedUsers
            );

        } catch (error) {

            console.error(
                "Banned user retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve banned users."
            });
        }
    }
);


// ==================================================
// AUDIT LOGS
// ==================================================

router.get(
    "/audit-logs/:userId",
    async function (req, res) {

        try {

            const db =
                getDb();

            const usersCollection =
                db.collection("users");

            const bannedUsersCollection =
                db.collection("bannedUsers");

            const auditLogsCollection =
                db.collection("auditLogs");

            const superAdmin =
                await getSuperAdmin(
                    usersCollection,
                    req.params.userId
                );

            if (!superAdmin) {
                return res.status(403).json({
                    message:
                        "Access denied."
                });
            }

            const logs =
                await auditLogsCollection
                    .find(
                        {},
                        {
                            projection: {
                                _id: 0
                            }
                        }
                    )
                    .sort({
                        createdAt: -1
                    })
                    .toArray();

            const users =
                await usersCollection
                    .find(
                        {},
                        {
                            projection: {
                                _id: 0,
                                id: 1,
                                username: 1
                            }
                        }
                    )
                    .toArray();

            const bannedUsers =
                await bannedUsersCollection
                    .find(
                        {},
                        {
                            projection: {
                                _id: 0,
                                originalUserId: 1,
                                firstName: 1,
                                lastName: 1
                            }
                        }
                    )
                    .toArray();

            const userMap =
                new Map(
                    users.map(user => [
                        user.id,
                        user
                    ])
                );

            const bannedUserMap =
                new Map(
                    bannedUsers.map(user => [
                        user.originalUserId,
                        user
                    ])
                );

            const enrichedLogs =
                logs.map(log => {

                    const actor =
                        userMap.get(
                            log.actorId
                        );

                    const targetUser =
                        userMap.get(
                            log.targetId
                        );

                    const bannedTarget =
                        bannedUserMap.get(
                            log.targetId
                        );

                    return {
                        ...log,

                        actorUsername:
                            actor?.username ||
                            "Unknown User",

                        targetUsername:
                            targetUser?.username ||
                            (
                                bannedTarget
                                    ? `${bannedTarget.firstName} ${bannedTarget.lastName}`
                                    : null
                            )
                    };
                });

            return res.json(
                enrichedLogs
            );

        } catch (error) {

            console.error(
                "Audit log retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve audit logs."
            });
        }
    }
);

module.exports = router;