const express = require("express");
const crypto = require("crypto");

const {
    readData,
    writeData
} = require("../utils/fileStore");

const router = express.Router();


// ==================================================
// HELPERS
// ==================================================

function enrichRequest(request, data) {

    const requester = data.users.find(
        user =>
            user.id === request.requesterId
    );


    const target = data.users.find(
        user =>
            user.id === request.targetUserId
    );


    const group = data.groups.find(
        currentGroup =>
            currentGroup.id ===
            request.targetGroupId
    );


    return {
        ...request,

        requesterUsername:
            requester?.username ||
            "Unknown User",

        targetUsername:
            target?.username ||
            null,

        groupTitle:
            group?.title ||
            request.details?.groupTitle ||
            null
    };
}


function addAuditLog(
    data,
    type,
    actorId,
    targetId,
    details
) {

    if (!Array.isArray(data.auditLogs)) {
        data.auditLogs = [];
    }


    data.auditLogs.push({

        id: crypto.randomUUID(),

        type,

        actorId,

        targetId:
            targetId || null,

        details:
            details || {},

        createdAt:
            new Date().toISOString()
    });
}



// ==================================================
// GROUP CREATION REQUEST
// ==================================================

router.post(
    "/group-creation",
    function(req, res) {

        try {

            const {
                requesterId,
                title,
                description,
                minimumAge,
                theme
            } = req.body;


            if (
                !requesterId ||
                !title ||
                !description ||
                minimumAge === undefined ||
                !theme
            ) {
                return res.status(400).json({
                    message:
                        "All group information is required."
                });
            }


            const cleanTitle =
                title.trim();

            const cleanDescription =
                description.trim();

            const numericAge =
                Number(minimumAge);


            if (
                cleanTitle.length < 1 ||
                cleanTitle.length > 30
            ) {
                return res.status(400).json({
                    message:
                        "Group title must contain between 1 and 30 characters."
                });
            }


            if (
                cleanDescription.length < 1 ||
                cleanDescription.length > 250
            ) {
                return res.status(400).json({
                    message:
                        "Group description must contain between 1 and 250 characters."
                });
            }


            if (
                !Number.isInteger(numericAge) ||
                numericAge < 0
            ) {
                return res.status(400).json({
                    message:
                        "A valid minimum age is required."
                });
            }


            const data =
                readData();


            const requester =
                data.users.find(
                    user =>
                        user.id ===
                        requesterId
                );


            if (!requester) {
                return res.status(404).json({
                    message:
                        "Requesting user not found."
                });
            }


            if (
                requester.systemRole ===
                "superAdmin"
            ) {
                return res.status(403).json({
                    message:
                        "Super Administrator cannot request groups."
                });
            }


            // Creator must satisfy their own age restriction.
            if (
                requester.age <
                numericAge
            ) {
                return res.status(403).json({
                    message:
                        `You must be at least ${numericAge} years old to create this group.`
                });
            }


            const duplicateRequest =
                data.requests.some(
                    request =>
                        request.type ===
                            "groupCreation" &&
                        request.requesterId ===
                            requesterId &&
                        request.status ===
                            "pending" &&
                        request.details?.title
                            ?.toLowerCase() ===
                        cleanTitle.toLowerCase()
                );


            if (duplicateRequest) {
                return res.status(409).json({
                    message:
                        "A pending request already exists for this group."
                });
            }


            const request = {

                id:
                    crypto.randomUUID(),

                type:
                    "groupCreation",

                requesterId,

                targetGroupId:
                    null,

                targetUserId:
                    null,

                details: {
                    title:
                        cleanTitle,

                    description:
                        cleanDescription,

                    minimumAge:
                        numericAge,

                    theme
                },

                reason:
                    null,

                status:
                    "pending",

                rejectionReason:
                    null,

                createdAt:
                    new Date().toISOString()
            };


            data.requests.push(request);

            writeData(data);


            return res.status(201).json({
                message:
                    "Group creation request submitted.",

                request
            });


        } catch (error) {

            console.error(
                "Group creation request error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to submit group creation request."
            });
        }
    }
);



// ==================================================
// JOIN GROUP REQUEST
// ==================================================

router.post(
    "/join",
    function(req, res) {

        try {

            const {
                requesterId,
                groupId
            } = req.body;


            if (
                !requesterId ||
                !groupId
            ) {
                return res.status(400).json({
                    message:
                        "User and group are required."
                });
            }


            const data =
                readData();


            const user =
                data.users.find(
                    currentUser =>
                        currentUser.id ===
                        requesterId
                );


            const group =
                data.groups.find(
                    currentGroup =>
                        currentGroup.id ===
                        groupId
                );


            if (!user) {
                return res.status(404).json({
                    message:
                        "User not found."
                });
            }


            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found."
                });
            }


            if (
                group.memberIds.includes(
                    user.id
                )
            ) {
                return res.status(409).json({
                    message:
                        "You are already a member of this group."
                });
            }


            if (
                group.bannedUserIds.includes(
                    user.id
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are banned from this group."
                });
            }


            if (
                user.age <
                group.minimumAge
            ) {
                return res.status(403).json({
                    message:
                        `You must be at least ${group.minimumAge} years old to join this group.`
                });
            }


            const pendingRequest =
                data.requests.some(
                    request =>
                        request.type ===
                            "joinGroup" &&
                        request.requesterId ===
                            user.id &&
                        request.targetGroupId ===
                            group.id &&
                        request.status ===
                            "pending"
                );


            if (pendingRequest) {
                return res.status(409).json({
                    message:
                        "You already have a pending request for this group."
                });
            }


            const request = {

                id:
                    crypto.randomUUID(),

                type:
                    "joinGroup",

                requesterId:
                    user.id,

                targetGroupId:
                    group.id,

                targetUserId:
                    null,

                details: {},

                reason:
                    null,

                status:
                    "pending",

                rejectionReason:
                    null,

                createdAt:
                    new Date().toISOString()
            };


            data.requests.push(request);

            writeData(data);


            return res.status(201).json({
                message:
                    "Join request submitted.",

                request
            });


        } catch (error) {

            console.error(
                "Join request error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to submit join request."
            });
        }
    }
);



// ==================================================
// ROOM CREATION REQUEST
// ==================================================

router.post(
    "/room-creation",
    function(req, res) {

        try {

            const {
                requesterId,
                groupId,
                roomName
            } = req.body;


            if (
                !requesterId ||
                !groupId ||
                !roomName?.trim()
            ) {
                return res.status(400).json({
                    message:
                        "User, group and room name are required."
                });
            }


            const data =
                readData();


            const user =
                data.users.find(
                    currentUser =>
                        currentUser.id ===
                        requesterId
                );


            const group =
                data.groups.find(
                    currentGroup =>
                        currentGroup.id ===
                        groupId
                );


            if (!user) {
                return res.status(404).json({
                    message:
                        "User not found."
                });
            }


            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found."
                });
            }


            if (
                !group.memberIds.includes(
                    user.id
                )
            ) {
                return res.status(403).json({
                    message:
                        "You must be a member of the group to propose a room."
                });
            }


            const pendingRequest =
                data.requests.some(
                    request =>
                        request.type ===
                            "roomCreation" &&
                        request.requesterId ===
                            user.id &&
                        request.targetGroupId ===
                            group.id &&
                        request.status ===
                            "pending" &&
                        request.details?.roomName
                            ?.toLowerCase() ===
                        roomName
                            .trim()
                            .toLowerCase()
                );


            if (pendingRequest) {
                return res.status(409).json({
                    message:
                        "You already have a pending request for this room."
                });
            }


            const request = {

                id:
                    crypto.randomUUID(),

                type:
                    "roomCreation",

                requesterId:
                    user.id,

                targetGroupId:
                    group.id,

                targetUserId:
                    null,

                details: {
                    roomName:
                        roomName.trim()
                },

                reason:
                    null,

                status:
                    "pending",

                rejectionReason:
                    null,

                createdAt:
                    new Date().toISOString()
            };


            data.requests.push(request);

            writeData(data);


            return res.status(201).json({
                message:
                    "Room creation request submitted.",

                request
            });


        } catch (error) {

            console.error(
                "Room creation request error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to submit room creation request."
            });
        }
    }
);



// ==================================================
// GROUP BAN REQUEST
// ==================================================

router.post(
    "/group-ban",
    function(req, res) {

        try {

            const {
                requesterId,
                groupId,
                targetUserId,
                reason
            } = req.body;


            if (
                !requesterId ||
                !groupId ||
                !targetUserId ||
                !reason?.trim()
            ) {
                return res.status(400).json({
                    message:
                        "User, group, target user and reason are required."
                });
            }


            if (
                requesterId ===
                targetUserId
            ) {
                return res.status(400).json({
                    message:
                        "You cannot request a ban against yourself."
                });
            }


            const data =
                readData();


            const requester =
                data.users.find(
                    user =>
                        user.id ===
                        requesterId
                );


            const target =
                data.users.find(
                    user =>
                        user.id ===
                        targetUserId
                );


            const group =
                data.groups.find(
                    currentGroup =>
                        currentGroup.id ===
                        groupId
                );


            if (!requester || !target) {
                return res.status(404).json({
                    message:
                        "User not found."
                });
            }


            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found."
                });
            }


            if (
                !group.memberIds.includes(
                    requesterId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You must be a group member to submit a ban request."
                });
            }


            if (
                !group.memberIds.includes(
                    targetUserId
                )
            ) {
                return res.status(400).json({
                    message:
                        "The target user is not a member of this group."
                });
            }


            const existingRequest =
                data.requests.some(
                    request =>
                        request.type ===
                            "groupBan" &&
                        request.targetGroupId ===
                            groupId &&
                        request.targetUserId ===
                            targetUserId &&
                        request.status ===
                            "pending"
                );


            if (existingRequest) {
                return res.status(409).json({
                    message:
                        "A pending ban request already exists for this user."
                });
            }


            const request = {

                id:
                    crypto.randomUUID(),

                type:
                    "groupBan",

                requesterId,

                targetGroupId:
                    groupId,

                targetUserId,

                details: {},

                reason:
                    reason.trim(),

                status:
                    "pending",

                rejectionReason:
                    null,

                createdAt:
                    new Date().toISOString()
            };


            data.requests.push(request);

            writeData(data);


            return res.status(201).json({
                message:
                    "Group ban request submitted.",

                request
            });


        } catch (error) {

            console.error(
                "Group ban request error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to submit group ban request."
            });
        }
    }
);



// ==================================================
// SYSTEM BAN REQUEST
// ==================================================

router.post(
    "/system-ban",
    function(req, res) {

        try {

            const {
                requesterId,
                groupId,
                targetUserId,
                reason
            } = req.body;


            if (
                !requesterId ||
                !groupId ||
                !targetUserId ||
                !reason?.trim()
            ) {
                return res.status(400).json({
                    message:
                        "Administrator, group, target user and reason are required."
                });
            }


            if (
                requesterId ===
                targetUserId
            ) {
                return res.status(400).json({
                    message:
                        "You cannot request a system ban against yourself."
                });
            }


            const data =
                readData();


            const group =
                data.groups.find(
                    currentGroup =>
                        currentGroup.id ===
                        groupId
                );


            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found."
                });
            }


            if (
                !group.adminIds.includes(
                    requesterId
                )
            ) {
                return res.status(403).json({
                    message:
                        "Only a Group Administrator can request a system ban."
                });
            }


            if (
                !group.memberIds.includes(
                    targetUserId
                )
            ) {
                return res.status(400).json({
                    message:
                        "The target user is not a member of this group."
                });
            }


            const target =
                data.users.find(
                    user =>
                        user.id ===
                        targetUserId
                );


            if (!target) {
                return res.status(404).json({
                    message:
                        "Target user not found."
                });
            }


            const existingRequest =
                data.requests.some(
                    request =>
                        request.type ===
                            "systemBan" &&
                        request.targetUserId ===
                            targetUserId &&
                        request.status ===
                            "pending"
                );


            if (existingRequest) {
                return res.status(409).json({
                    message:
                        "A pending system ban request already exists for this user."
                });
            }


            const request = {

                id:
                    crypto.randomUUID(),

                type:
                    "systemBan",

                requesterId,

                targetGroupId:
                    groupId,

                targetUserId,

                details: {},

                reason:
                    reason.trim(),

                status:
                    "pending",

                rejectionReason:
                    null,

                createdAt:
                    new Date().toISOString()
            };


            data.requests.push(request);

            writeData(data);


            return res.status(201).json({
                message:
                    "System ban request submitted.",

                request
            });


        } catch (error) {

            console.error(
                "System ban request error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to submit system ban request."
            });
        }
    }
);



// ==================================================
// STAGE P — GROUP DELETION REQUEST
// ==================================================

router.post(
    "/group-deletion",
    function(req, res) {

        try {

            const {
                requesterId,
                groupId,
                reason
            } = req.body;


            if (
                !requesterId ||
                !groupId
            ) {
                return res.status(400).json({
                    message:
                        "Administrator and group are required."
                });
            }


            const data =
                readData();


            const group =
                data.groups.find(
                    currentGroup =>
                        currentGroup.id ===
                        groupId
                );


            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found."
                });
            }


            if (
                !group.adminIds.includes(
                    requesterId
                )
            ) {
                return res.status(403).json({
                    message:
                        "Only a Group Administrator can request group deletion."
                });
            }


            const existingRequest =
                data.requests.some(
                    request =>
                        request.type ===
                            "groupDeletion" &&
                        request.targetGroupId ===
                            groupId &&
                        request.status ===
                            "pending"
                );


            if (existingRequest) {
                return res.status(409).json({
                    message:
                        "A group deletion request is already pending."
                });
            }


            const request = {

                id:
                    crypto.randomUUID(),

                type:
                    "groupDeletion",

                requesterId,

                targetGroupId:
                    group.id,

                targetUserId:
                    null,

                details: {
                    groupTitle:
                        group.title
                },

                reason:
                    reason?.trim() ||
                    null,

                status:
                    "pending",

                rejectionReason:
                    null,

                createdAt:
                    new Date().toISOString()
            };


            data.requests.push(request);

            writeData(data);


            return res.status(201).json({
                message:
                    "Group deletion request submitted to the Super Administrator.",

                request
            });


        } catch (error) {

            console.error(
                "Group deletion request error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to submit group deletion request."
            });
        }
    }
);



// ==================================================
// SUPER ADMIN PENDING REQUESTS
// ==================================================

router.get(
    "/super-admin/:userId",
    function(req, res) {

        try {

            const data =
                readData();


            const user =
                data.users.find(
                    currentUser =>
                        currentUser.id ===
                        req.params.userId
                );


            if (
                !user ||
                user.systemRole !==
                    "superAdmin"
            ) {
                return res.status(403).json({
                    message:
                        "Access denied."
                });
            }


            const requests =
                data.requests
                    .filter(
                        request =>
                            (
                                request.type ===
                                    "groupCreation" ||

                                request.type ===
                                    "systemBan" ||

                                request.type ===
                                    "groupDeletion"
                            )
                            &&
                            request.status ===
                                "pending"
                    )
                    .map(
                        request =>
                            enrichRequest(
                                request,
                                data
                            )
                    );


            return res.json(requests);


        } catch (error) {

            console.error(
                "Super Admin request retrieval error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to retrieve requests."
            });
        }
    }
);



// ==================================================
// GROUP ADMIN PENDING REQUESTS
// ==================================================

router.get(
    "/group-admin/:userId/:groupId",
    function(req, res) {

        try {

            const data =
                readData();


            const group =
                data.groups.find(
                    currentGroup =>
                        currentGroup.id ===
                        req.params.groupId
                );


            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found."
                });
            }


            if (
                !group.adminIds.includes(
                    req.params.userId
                )
            ) {
                return res.status(403).json({
                    message:
                        "Access denied."
                });
            }


            const requests =
                data.requests
                    .filter(
                        request =>
                            (
                                request.type ===
                                    "joinGroup" ||

                                request.type ===
                                    "roomCreation" ||

                                request.type ===
                                    "groupBan"
                            )
                            &&
                            request.targetGroupId ===
                                group.id
                            &&
                            request.status ===
                                "pending"
                    )
                    .map(
                        request =>
                            enrichRequest(
                                request,
                                data
                            )
                    );


            return res.json(requests);


        } catch (error) {

            console.error(
                "Group Admin request retrieval error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to retrieve requests."
            });
        }
    }
);



// ==================================================
// STAGE P — USER REQUEST HISTORY
// ==================================================

router.get(
    "/user/:userId/history",
    function(req, res) {

        try {

            const data =
                readData();


            const user =
                data.users.find(
                    currentUser =>
                        currentUser.id ===
                        req.params.userId
                );


            if (!user) {
                return res.status(404).json({
                    message:
                        "User not found."
                });
            }


            const requests =
                data.requests
                    .filter(
                        request =>
                            request.requesterId ===
                            user.id
                    )
                    .map(
                        request =>
                            enrichRequest(
                                request,
                                data
                            )
                    )
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt) -
                            new Date(a.createdAt)
                    );


            return res.json(requests);


        } catch (error) {

            console.error(
                "Request history retrieval error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to retrieve request history."
            });
        }
    }
);



// ==================================================
// APPROVE / REJECT REQUEST
// ==================================================

router.put(
    "/:requestId",
    function(req, res) {

        try {

            const {
                actorId,
                status,
                rejectionReason
            } = req.body;


            if (!actorId) {
                return res.status(400).json({
                    message:
                        "Administrator is required."
                });
            }


            if (
                status !== "approved" &&
                status !== "rejected"
            ) {
                return res.status(400).json({
                    message:
                        "Request status must be approved or rejected."
                });
            }


            if (
                status === "rejected" &&
                !rejectionReason?.trim()
            ) {
                return res.status(400).json({
                    message:
                        "A rejection reason is required."
                });
            }


            const data =
                readData();


            const request =
                data.requests.find(
                    currentRequest =>
                        currentRequest.id ===
                        req.params.requestId
                );


            if (!request) {
                return res.status(404).json({
                    message:
                        "Request not found."
                });
            }


            if (
                request.status !==
                "pending"
            ) {
                return res.status(409).json({
                    message:
                        "This request has already been actioned."
                });
            }



            // ==========================================
            // GROUP CREATION
            // ==========================================

            if (
                request.type ===
                "groupCreation"
            ) {

                const actor =
                    data.users.find(
                        user =>
                            user.id ===
                            actorId
                    );


                if (
                    !actor ||
                    actor.systemRole !==
                        "superAdmin"
                ) {
                    return res.status(403).json({
                        message:
                            "Only the Super Administrator can action group creation requests."
                    });
                }


                if (
                    status ===
                    "approved"
                ) {

                    const requester =
                        data.users.find(
                            user =>
                                user.id ===
                                request.requesterId
                        );


                    if (!requester) {
                        return res.status(404).json({
                            message:
                                "Requesting user no longer exists."
                        });
                    }


                    if (
                        requester.age <
                        request.details.minimumAge
                    ) {
                        return res.status(403).json({
                            message:
                                "The requester no longer meets the minimum age requirement for this group."
                        });
                    }


                    const group = {

                        id:
                            crypto.randomUUID(),

                        title:
                            request.details.title,

                        description:
                            request.details.description,

                        minimumAge:
                            request.details.minimumAge,

                        theme:
                            request.details.theme,

                        adminIds: [
                            requester.id
                        ],

                        memberIds: [
                            requester.id
                        ],

                        bannedUserIds: [],

                        roomIds: [],

                        createdAt:
                            new Date().toISOString()
                    };


                    data.groups.push(group);
                }
            }



            // ==========================================
            // JOIN GROUP
            // ==========================================

            if (
                request.type ===
                "joinGroup"
            ) {

                const group =
                    data.groups.find(
                        currentGroup =>
                            currentGroup.id ===
                            request.targetGroupId
                    );


                if (!group) {
                    return res.status(404).json({
                        message:
                            "Group not found."
                    });
                }


                if (
                    !group.adminIds.includes(
                        actorId
                    )
                ) {
                    return res.status(403).json({
                        message:
                            "Only a Group Administrator can action this join request."
                    });
                }


                if (
                    status ===
                    "approved"
                ) {

                    const user =
                        data.users.find(
                            currentUser =>
                                currentUser.id ===
                                request.requesterId
                        );


                    if (!user) {
                        return res.status(404).json({
                            message:
                                "Requesting user no longer exists."
                        });
                    }


                    if (
                        user.age <
                        group.minimumAge
                    ) {
                        return res.status(403).json({
                            message:
                                "User no longer meets the minimum age requirement."
                        });
                    }


                    if (
                        group.bannedUserIds.includes(
                            user.id
                        )
                    ) {
                        return res.status(403).json({
                            message:
                                "User is banned from this group."
                        });
                    }


                    if (
                        !group.memberIds.includes(
                            user.id
                        )
                    ) {
                        group.memberIds.push(
                            user.id
                        );
                    }
                }
            }



            // ==========================================
            // ROOM CREATION
            // ==========================================

            if (
                request.type ===
                "roomCreation"
            ) {

                const group =
                    data.groups.find(
                        currentGroup =>
                            currentGroup.id ===
                            request.targetGroupId
                    );


                if (!group) {
                    return res.status(404).json({
                        message:
                            "Group not found."
                    });
                }


                if (
                    !group.adminIds.includes(
                        actorId
                    )
                ) {
                    return res.status(403).json({
                        message:
                            "Only a Group Administrator can action this room request."
                    });
                }


                if (
                    status ===
                    "approved"
                ) {

                    const room = {

                        id:
                            crypto.randomUUID(),

                        groupId:
                            group.id,

                        name:
                            request.details.roomName,

                        createdAt:
                            new Date().toISOString()
                    };


                    data.rooms.push(room);

                    group.roomIds.push(
                        room.id
                    );
                }
            }



            // ==========================================
            // GROUP BAN
            // ==========================================

            if (
                request.type ===
                "groupBan"
            ) {

                const group =
                    data.groups.find(
                        currentGroup =>
                            currentGroup.id ===
                            request.targetGroupId
                    );


                if (!group) {
                    return res.status(404).json({
                        message:
                            "Group not found."
                    });
                }


                if (
                    !group.adminIds.includes(
                        actorId
                    )
                ) {
                    return res.status(403).json({
                        message:
                            "Only a Group Administrator can action this ban request."
                    });
                }


                if (
                    actorId ===
                    request.requesterId
                ) {
                    return res.status(403).json({
                        message:
                            "You cannot action a ban request that you submitted yourself."
                    });
                }


                if (
                    status ===
                    "approved"
                ) {

                    const targetUserId =
                        request.targetUserId;


                    if (
                        !group.memberIds.includes(
                            targetUserId
                        )
                    ) {
                        return res.status(400).json({
                            message:
                                "Target user is no longer a member of this group."
                        });
                    }


                    if (
                        group.adminIds.includes(
                            targetUserId
                        )
                        &&
                        group.adminIds.length <= 1
                    ) {
                        return res.status(409).json({
                            message:
                                "The only Group Administrator cannot be banned. Promote another administrator first."
                        });
                    }


                    if (
                        !group.bannedUserIds.includes(
                            targetUserId
                        )
                    ) {
                        group.bannedUserIds.push(
                            targetUserId
                        );
                    }


                    group.memberIds =
                        group.memberIds.filter(
                            memberId =>
                                memberId !==
                                targetUserId
                        );


                    group.adminIds =
                        group.adminIds.filter(
                            adminId =>
                                adminId !==
                                targetUserId
                        );
                }
            }



            // ==========================================
            // SYSTEM BAN
            // ==========================================

            if (
                request.type ===
                "systemBan"
            ) {

                const actor =
                    data.users.find(
                        user =>
                            user.id ===
                            actorId
                    );


                if (
                    !actor ||
                    actor.systemRole !==
                        "superAdmin"
                ) {
                    return res.status(403).json({
                        message:
                            "Only the Super Administrator can action a system ban request."
                    });
                }


                if (
                    status ===
                    "approved"
                ) {

                    const target =
                        data.users.find(
                            user =>
                                user.id ===
                                request.targetUserId
                        );


                    if (!target) {
                        return res.status(404).json({
                            message:
                                "Target user no longer exists."
                        });
                    }


                    const soleAdminGroup =
                        data.groups.find(
                            group =>
                                group.adminIds.includes(
                                    target.id
                                )
                                &&
                                group.adminIds.length === 1
                        );


                    if (soleAdminGroup) {
                        return res.status(409).json({
                            message:
                                `User is the only administrator of "${soleAdminGroup.title}". Promote another administrator first.`
                        });
                    }


                    for (
                        const group
                        of data.groups
                    ) {

                        group.memberIds =
                            group.memberIds.filter(
                                id =>
                                    id !==
                                    target.id
                            );


                        group.adminIds =
                            group.adminIds.filter(
                                id =>
                                    id !==
                                    target.id
                            );
                    }


                    if (
                        !Array.isArray(
                            data.bannedUsers
                        )
                    ) {
                        data.bannedUsers = [];
                    }


                    data.bannedUsers.push({

                        id:
                            crypto.randomUUID(),

                        originalUserId:
                            target.id,

                        firstName:
                            target.firstName,

                        lastName:
                            target.lastName,

                        email:
                            target.email,

                        reason:
                            request.reason,

                        bannedBy:
                            actor.id,

                        bannedAt:
                            new Date().toISOString()
                    });


                    data.users =
                        data.users.filter(
                            user =>
                                user.id !==
                                target.id
                        );
                }
            }



            // ==========================================
            // STAGE P — GROUP DELETION
            // ==========================================

            if (
                request.type ===
                "groupDeletion"
            ) {

                const actor =
                    data.users.find(
                        user =>
                            user.id ===
                            actorId
                    );


                if (
                    !actor ||
                    actor.systemRole !==
                        "superAdmin"
                ) {
                    return res.status(403).json({
                        message:
                            "Only the Super Administrator can action group deletion requests."
                    });
                }


                if (
                    status ===
                    "approved"
                ) {

                    const group =
                        data.groups.find(
                            currentGroup =>
                                currentGroup.id ===
                                request.targetGroupId
                        );


                    if (!group) {
                        return res.status(404).json({
                            message:
                                "Group no longer exists."
                        });
                    }


                    // Requester must still be an admin
                    // when deletion is approved.
                    if (
                        !group.adminIds.includes(
                            request.requesterId
                        )
                    ) {
                        return res.status(409).json({
                            message:
                                "The requester is no longer a Group Administrator of this group."
                        });
                    }


                    const roomIds =
                        [...group.roomIds];


                    // Delete the group.
                    data.groups =
                        data.groups.filter(
                            currentGroup =>
                                currentGroup.id !==
                                group.id
                        );


                    // Delete rooms belonging to group.
                    data.rooms =
                        data.rooms.filter(
                            room =>
                                room.groupId !==
                                group.id
                        );


                    // If messages already exist,
                    // remove messages from deleted rooms.
                    if (
                        Array.isArray(
                            data.messages
                        )
                    ) {

                        data.messages =
                            data.messages.filter(
                                message =>
                                    !roomIds.includes(
                                        message.roomId
                                    )
                            );
                    }
                }
            }



            // ==========================================
            // FINISH REQUEST
            // ==========================================

            request.status =
                status;


            request.rejectionReason =
                status === "rejected"
                    ? rejectionReason.trim()
                    : null;



            // ==========================================
            // AUDIT LOG — EVERY REQUEST ACTION
            // ==========================================

            addAuditLog(
                data,

                status === "approved"
                    ? "requestApproved"
                    : "requestRejected",

                actorId,

                request.targetUserId ||
                request.targetGroupId ||
                request.requesterId,

                {
                    requestId:
                        request.id,

                    requestType:
                        request.type,

                    targetGroupId:
                        request.targetGroupId,

                    rejectionReason:
                        request.rejectionReason
                }
            );



            // Extra important audit entries.

            if (
                status === "approved" &&
                request.type ===
                    "groupDeletion"
            ) {

                addAuditLog(
                    data,

                    "groupDeleted",

                    actorId,

                    request.targetGroupId,

                    {
                        groupTitle:
                            request.details?.groupTitle,

                        requestId:
                            request.id
                    }
                );
            }


            if (
                status === "approved" &&
                request.type ===
                    "systemBan"
            ) {

                addAuditLog(
                    data,

                    "systemBan",

                    actorId,

                    request.targetUserId,

                    {
                        reason:
                            request.reason,

                        requestId:
                            request.id
                    }
                );
            }


            if (
                status === "approved" &&
                request.type ===
                    "groupBan"
            ) {

                addAuditLog(
                    data,

                    "groupBan",

                    actorId,

                    request.targetUserId,

                    {
                        groupId:
                            request.targetGroupId,

                        reason:
                            request.reason,

                        requestId:
                            request.id
                    }
                );
            }


            writeData(data);


            return res.json({

                message:
                    `Request ${status} successfully.`,

                request
            });


        } catch (error) {

            console.error(
                "Request action error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to action request."
            });
        }
    }
);


module.exports = router;