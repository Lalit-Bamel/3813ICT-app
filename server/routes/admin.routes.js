const express = require("express");

const {
    readData
} = require("../utils/fileStore");

const router = express.Router();


// ==================================================
// CHECK SUPER ADMIN
// ==================================================

function getSuperAdmin(
    data,
    userId
) {

    return data.users.find(
        user =>
            user.id === userId &&
            user.systemRole ===
                "superAdmin"
    );
}



// ==================================================
// PERMANENTLY BANNED USERS
// ==================================================

router.get(
    "/banned-users/:userId",
    function(req, res) {

        try {

            const data =
                readData();


            const superAdmin =
                getSuperAdmin(
                    data,
                    req.params.userId
                );


            if (!superAdmin) {
                return res.status(403).json({
                    message:
                        "Access denied."
                });
            }


            return res.json(
                data.bannedUsers || []
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
// STAGE P — AUDIT LOGS
// ==================================================

router.get(
    "/audit-logs/:userId",
    function(req, res) {

        try {

            const data =
                readData();


            const superAdmin =
                getSuperAdmin(
                    data,
                    req.params.userId
                );


            if (!superAdmin) {
                return res.status(403).json({
                    message:
                        "Access denied."
                });
            }


            const logs =
                (data.auditLogs || [])
                    .map(log => {

                        const actor =
                            data.users.find(
                                user =>
                                    user.id ===
                                    log.actorId
                            );


                        const targetUser =
                            data.users.find(
                                user =>
                                    user.id ===
                                    log.targetId
                            );


                        const bannedTarget =
                            (data.bannedUsers || [])
                                .find(
                                    user =>
                                        user.originalUserId ===
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
                    })
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt) -
                            new Date(a.createdAt)
                    );


            return res.json(logs);


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