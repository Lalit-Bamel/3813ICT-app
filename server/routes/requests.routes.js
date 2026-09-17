const express = require("express");
const crypto = require("crypto");

const { getDb } = require("../db/mongo");

const router = express.Router();

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createAuditLog(type, actorId, targetId, details) {
    return {
        id: crypto.randomUUID(),
        type,
        actorId,
        targetId: targetId || null,
        details: details || {},
        createdAt: new Date().toISOString()
    };
}

async function enrichRequests(requests, usersCollection, groupsCollection) {
    const userIds = [...new Set(
        requests.flatMap(request => [
            request.requesterId,
            request.targetUserId
        ]).filter(Boolean)
    )];

    const groupIds = [...new Set(
        requests.map(request => request.targetGroupId).filter(Boolean)
    )];

    const [users, groups] = await Promise.all([
        userIds.length
            ? usersCollection.find(
                { id: { $in: userIds } },
                { projection: { _id: 0, id: 1, username: 1 } }
            ).toArray()
            : [],
        groupIds.length
            ? groupsCollection.find(
                { id: { $in: groupIds } },
                { projection: { _id: 0, id: 1, title: 1 } }
            ).toArray()
            : []
    ]);

    const usersById = new Map(users.map(user => [user.id, user]));
    const groupsById = new Map(groups.map(group => [group.id, group]));

    return requests.map(request => ({
        ...request,
        requesterUsername:
            usersById.get(request.requesterId)?.username || "Unknown User",
        targetUsername:
            usersById.get(request.targetUserId)?.username || null,
        groupTitle:
            groupsById.get(request.targetGroupId)?.title ||
            request.details?.groupTitle ||
            null
    }));
}


// ==================================================
// GROUP CREATION REQUEST
// ==================================================

router.post("/group-creation", async function(req, res) {
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
                message: "All group information is required."
            });
        }

        const cleanTitle = title.trim();
        const cleanDescription = description.trim();
        const numericAge = Number(minimumAge);

        if (cleanTitle.length < 1 || cleanTitle.length > 30) {
            return res.status(400).json({
                message: "Group title must contain between 1 and 30 characters."
            });
        }

        if (cleanDescription.length < 1 || cleanDescription.length > 250) {
            return res.status(400).json({
                message: "Group description must contain between 1 and 250 characters."
            });
        }

        if (!Number.isInteger(numericAge) || numericAge < 0) {
            return res.status(400).json({
                message: "A valid minimum age is required."
            });
        }

        const db = getDb();
        const usersCollection = db.collection("users");
        const requestsCollection = db.collection("requests");

        const requester = await usersCollection.findOne({ id: requesterId });

        if (!requester) {
            return res.status(404).json({
                message: "Requesting user not found."
            });
        }

        if (requester.systemRole === "superAdmin") {
            return res.status(403).json({
                message: "Super Administrator cannot request groups."
            });
        }

        if (requester.age < numericAge) {
            return res.status(403).json({
                message: `You must be at least ${numericAge} years old to create this group.`
            });
        }

        const duplicateRequest = await requestsCollection.findOne({
            type: "groupCreation",
            requesterId,
            status: "pending",
            "details.title": {
                $regex: `^${escapeRegex(cleanTitle)}$`,
                $options: "i"
            }
        });

        if (duplicateRequest) {
            return res.status(409).json({
                message: "A pending request already exists for this group."
            });
        }

        const request = {
            id: crypto.randomUUID(),
            type: "groupCreation",
            requesterId,
            targetGroupId: null,
            targetUserId: null,
            details: {
                title: cleanTitle,
                description: cleanDescription,
                minimumAge: numericAge,
                theme
            },
            reason: null,
            status: "pending",
            rejectionReason: null,
            createdAt: new Date().toISOString()
        };

        await requestsCollection.insertOne(request);
        delete request._id;

        return res.status(201).json({
            message: "Group creation request submitted.",
            request
        });
    } catch (error) {
        console.error("Group creation request error:", error);
        return res.status(500).json({
            message: "Unable to submit group creation request."
        });
    }
});


// ==================================================
// JOIN GROUP REQUEST
// ==================================================

router.post("/join", async function(req, res) {
    try {
        const { requesterId, groupId } = req.body;

        if (!requesterId || !groupId) {
            return res.status(400).json({
                message: "User and group are required."
            });
        }

        const db = getDb();
        const usersCollection = db.collection("users");
        const groupsCollection = db.collection("groups");
        const requestsCollection = db.collection("requests");

        const [user, group] = await Promise.all([
            usersCollection.findOne({ id: requesterId }),
            groupsCollection.findOne({ id: groupId })
        ]);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        if (group.memberIds.includes(user.id)) {
            return res.status(409).json({
                message: "You are already a member of this group."
            });
        }

        if (group.bannedUserIds.includes(user.id)) {
            return res.status(403).json({
                message: "You are banned from this group."
            });
        }

        if (user.age < group.minimumAge) {
            return res.status(403).json({
                message: `You must be at least ${group.minimumAge} years old to join this group.`
            });
        }

        const pendingRequest = await requestsCollection.findOne({
            type: "joinGroup",
            requesterId: user.id,
            targetGroupId: group.id,
            status: "pending"
        });

        if (pendingRequest) {
            return res.status(409).json({
                message: "You already have a pending request for this group."
            });
        }

        const request = {
            id: crypto.randomUUID(),
            type: "joinGroup",
            requesterId: user.id,
            targetGroupId: group.id,
            targetUserId: null,
            details: {},
            reason: null,
            status: "pending",
            rejectionReason: null,
            createdAt: new Date().toISOString()
        };

        await requestsCollection.insertOne(request);
        delete request._id;

        return res.status(201).json({
            message: "Join request submitted.",
            request
        });
    } catch (error) {
        console.error("Join request error:", error);
        return res.status(500).json({
            message: "Unable to submit join request."
        });
    }
});


// ==================================================
// ROOM CREATION REQUEST
// ==================================================

router.post("/room-creation", async function(req, res) {
    try {
        const { requesterId, groupId, roomName } = req.body;

        if (!requesterId || !groupId || !roomName?.trim()) {
            return res.status(400).json({
                message: "User, group and room name are required."
            });
        }

        const db = getDb();
        const usersCollection = db.collection("users");
        const groupsCollection = db.collection("groups");
        const requestsCollection = db.collection("requests");

        const [user, group] = await Promise.all([
            usersCollection.findOne({ id: requesterId }),
            groupsCollection.findOne({ id: groupId })
        ]);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        if (!group.memberIds.includes(user.id)) {
            return res.status(403).json({
                message: "You must be a member of the group to propose a room."
            });
        }

        const cleanRoomName = roomName.trim();
        const pendingRequest = await requestsCollection.findOne({
            type: "roomCreation",
            requesterId: user.id,
            targetGroupId: group.id,
            status: "pending",
            "details.roomName": {
                $regex: `^${escapeRegex(cleanRoomName)}$`,
                $options: "i"
            }
        });

        if (pendingRequest) {
            return res.status(409).json({
                message: "You already have a pending request for this room."
            });
        }

        const request = {
            id: crypto.randomUUID(),
            type: "roomCreation",
            requesterId: user.id,
            targetGroupId: group.id,
            targetUserId: null,
            details: { roomName: cleanRoomName },
            reason: null,
            status: "pending",
            rejectionReason: null,
            createdAt: new Date().toISOString()
        };

        await requestsCollection.insertOne(request);
        delete request._id;

        return res.status(201).json({
            message: "Room creation request submitted.",
            request
        });
    } catch (error) {
        console.error("Room creation request error:", error);
        return res.status(500).json({
            message: "Unable to submit room creation request."
        });
    }
});


// ==================================================
// GROUP BAN REQUEST
// ==================================================

router.post("/group-ban", async function(req, res) {
    try {
        const { requesterId, groupId, targetUserId, reason } = req.body;

        if (!requesterId || !groupId || !targetUserId || !reason?.trim()) {
            return res.status(400).json({
                message: "User, group, target user and reason are required."
            });
        }

        if (requesterId === targetUserId) {
            return res.status(400).json({
                message: "You cannot request a ban against yourself."
            });
        }

        const db = getDb();
        const usersCollection = db.collection("users");
        const groupsCollection = db.collection("groups");
        const requestsCollection = db.collection("requests");

        const [requester, target, group] = await Promise.all([
            usersCollection.findOne({ id: requesterId }),
            usersCollection.findOne({ id: targetUserId }),
            groupsCollection.findOne({ id: groupId })
        ]);

        if (!requester || !target) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        if (!group.memberIds.includes(requesterId)) {
            return res.status(403).json({
                message: "You must be a group member to submit a ban request."
            });
        }

        if (!group.memberIds.includes(targetUserId)) {
            return res.status(400).json({
                message: "The target user is not a member of this group."
            });
        }

        const existingRequest = await requestsCollection.findOne({
            type: "groupBan",
            targetGroupId: groupId,
            targetUserId,
            status: "pending"
        });

        if (existingRequest) {
            return res.status(409).json({
                message: "A pending ban request already exists for this user."
            });
        }

        const request = {
            id: crypto.randomUUID(),
            type: "groupBan",
            requesterId,
            targetGroupId: groupId,
            targetUserId,
            details: {},
            reason: reason.trim(),
            status: "pending",
            rejectionReason: null,
            createdAt: new Date().toISOString()
        };

        await requestsCollection.insertOne(request);
        delete request._id;

        return res.status(201).json({
            message: "Group ban request submitted.",
            request
        });
    } catch (error) {
        console.error("Group ban request error:", error);
        return res.status(500).json({
            message: "Unable to submit group ban request."
        });
    }
});


// ==================================================
// SYSTEM BAN REQUEST
// ==================================================

router.post("/system-ban", async function(req, res) {
    try {
        const { requesterId, groupId, targetUserId, reason } = req.body;

        if (!requesterId || !groupId || !targetUserId || !reason?.trim()) {
            return res.status(400).json({
                message: "Administrator, group, target user and reason are required."
            });
        }

        if (requesterId === targetUserId) {
            return res.status(400).json({
                message: "You cannot request a system ban against yourself."
            });
        }

        const db = getDb();
        const usersCollection = db.collection("users");
        const groupsCollection = db.collection("groups");
        const requestsCollection = db.collection("requests");

        const group = await groupsCollection.findOne({ id: groupId });

        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        if (!group.adminIds.includes(requesterId)) {
            return res.status(403).json({
                message: "Only a Group Administrator can request a system ban."
            });
        }

        if (!group.memberIds.includes(targetUserId)) {
            return res.status(400).json({
                message: "The target user is not a member of this group."
            });
        }

        const target = await usersCollection.findOne({ id: targetUserId });

        if (!target) {
            return res.status(404).json({ message: "Target user not found." });
        }

        const existingRequest = await requestsCollection.findOne({
            type: "systemBan",
            targetUserId,
            status: "pending"
        });

        if (existingRequest) {
            return res.status(409).json({
                message: "A pending system ban request already exists for this user."
            });
        }

        const request = {
            id: crypto.randomUUID(),
            type: "systemBan",
            requesterId,
            targetGroupId: groupId,
            targetUserId,
            details: {},
            reason: reason.trim(),
            status: "pending",
            rejectionReason: null,
            createdAt: new Date().toISOString()
        };

        await requestsCollection.insertOne(request);
        delete request._id;

        return res.status(201).json({
            message: "System ban request submitted.",
            request
        });
    } catch (error) {
        console.error("System ban request error:", error);
        return res.status(500).json({
            message: "Unable to submit system ban request."
        });
    }
});


// ==================================================
// STAGE P — GROUP DELETION REQUEST
// ==================================================

router.post("/group-deletion", async function(req, res) {
    try {
        const { requesterId, groupId, reason } = req.body;

        if (!requesterId || !groupId) {
            return res.status(400).json({
                message: "Administrator and group are required."
            });
        }

        const db = getDb();
        const groupsCollection = db.collection("groups");
        const requestsCollection = db.collection("requests");

        const group = await groupsCollection.findOne({ id: groupId });

        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        if (!group.adminIds.includes(requesterId)) {
            return res.status(403).json({
                message: "Only a Group Administrator can request group deletion."
            });
        }

        const existingRequest = await requestsCollection.findOne({
            type: "groupDeletion",
            targetGroupId: groupId,
            status: "pending"
        });

        if (existingRequest) {
            return res.status(409).json({
                message: "A group deletion request is already pending."
            });
        }

        const request = {
            id: crypto.randomUUID(),
            type: "groupDeletion",
            requesterId,
            targetGroupId: group.id,
            targetUserId: null,
            details: { groupTitle: group.title },
            reason: reason?.trim() || null,
            status: "pending",
            rejectionReason: null,
            createdAt: new Date().toISOString()
        };

        await requestsCollection.insertOne(request);
        delete request._id;

        return res.status(201).json({
            message: "Group deletion request submitted to the Super Administrator.",
            request
        });
    } catch (error) {
        console.error("Group deletion request error:", error);
        return res.status(500).json({
            message: "Unable to submit group deletion request."
        });
    }
});


// ==================================================
// SUPER ADMIN PENDING REQUESTS
// ==================================================

router.get("/super-admin/:userId", async function(req, res) {
    try {
        const db = getDb();
        const usersCollection = db.collection("users");
        const groupsCollection = db.collection("groups");
        const requestsCollection = db.collection("requests");

        const user = await usersCollection.findOne({
            id: req.params.userId
        });

        if (!user || user.systemRole !== "superAdmin") {
            return res.status(403).json({ message: "Access denied." });
        }

        const requests = await requestsCollection.find(
            {
                type: {
                    $in: [
                        "groupCreation",
                        "systemBan",
                        "groupDeletion"
                    ]
                },
                status: "pending"
            },
            { projection: { _id: 0 } }
        ).toArray();

        return res.json(
            await enrichRequests(
                requests,
                usersCollection,
                groupsCollection
            )
        );
    } catch (error) {
        console.error("Super Admin request retrieval error:", error);
        return res.status(500).json({
            message: "Unable to retrieve requests."
        });
    }
});


// ==================================================
// GROUP ADMIN PENDING REQUESTS
// ==================================================

router.get("/group-admin/:userId/:groupId", async function(req, res) {
    try {
        const db = getDb();
        const usersCollection = db.collection("users");
        const groupsCollection = db.collection("groups");
        const requestsCollection = db.collection("requests");

        const group = await groupsCollection.findOne({
            id: req.params.groupId
        });

        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        if (!group.adminIds.includes(req.params.userId)) {
            return res.status(403).json({ message: "Access denied." });
        }

        const requests = await requestsCollection.find(
            {
                type: {
                    $in: [
                        "joinGroup",
                        "roomCreation",
                        "groupBan"
                    ]
                },
                targetGroupId: group.id,
                status: "pending"
            },
            { projection: { _id: 0 } }
        ).toArray();

        return res.json(
            await enrichRequests(
                requests,
                usersCollection,
                groupsCollection
            )
        );
    } catch (error) {
        console.error("Group Admin request retrieval error:", error);
        return res.status(500).json({
            message: "Unable to retrieve requests."
        });
    }
});


// ==================================================
// STAGE P — USER REQUEST HISTORY
// ==================================================

router.get("/user/:userId/history", async function(req, res) {
    try {
        const db = getDb();
        const usersCollection = db.collection("users");
        const groupsCollection = db.collection("groups");
        const requestsCollection = db.collection("requests");

        const user = await usersCollection.findOne({
            id: req.params.userId
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const requests = await requestsCollection.find(
            { requesterId: user.id },
            { projection: { _id: 0 } }
        ).sort({ createdAt: -1 }).toArray();

        return res.json(
            await enrichRequests(
                requests,
                usersCollection,
                groupsCollection
            )
        );
    } catch (error) {
        console.error("Request history retrieval error:", error);
        return res.status(500).json({
            message: "Unable to retrieve request history."
        });
    }
});


// ==================================================
// APPROVE / REJECT REQUEST
// ==================================================

router.put("/:requestId", async function(req, res) {
    try {
        const { actorId, status, rejectionReason } = req.body;

        if (!actorId) {
            return res.status(400).json({
                message: "Administrator is required."
            });
        }

        if (status !== "approved" && status !== "rejected") {
            return res.status(400).json({
                message: "Request status must be approved or rejected."
            });
        }

        if (status === "rejected" && !rejectionReason?.trim()) {
            return res.status(400).json({
                message: "A rejection reason is required."
            });
        }

        const db = getDb();
        const usersCollection = db.collection("users");
        const groupsCollection = db.collection("groups");
        const roomsCollection = db.collection("rooms");
        const requestsCollection = db.collection("requests");
        const messagesCollection = db.collection("messages");
        const auditLogsCollection = db.collection("auditLogs");
        const bannedUsersCollection = db.collection("bannedUsers");

        const request = await requestsCollection.findOne(
            { id: req.params.requestId },
            { projection: { _id: 0 } }
        );

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        if (request.status !== "pending") {
            return res.status(409).json({
                message: "This request has already been actioned."
            });
        }

        if (request.type === "groupCreation") {
            const actor = await usersCollection.findOne({ id: actorId });

            if (!actor || actor.systemRole !== "superAdmin") {
                return res.status(403).json({
                    message: "Only the Super Administrator can action group creation requests."
                });
            }

            if (status === "approved") {
                const requester = await usersCollection.findOne({
                    id: request.requesterId
                });

                if (!requester) {
                    return res.status(404).json({
                        message: "Requesting user no longer exists."
                    });
                }

                if (requester.age < request.details.minimumAge) {
                    return res.status(403).json({
                        message: "The requester no longer meets the minimum age requirement for this group."
                    });
                }

                await groupsCollection.insertOne({
                    id: crypto.randomUUID(),
                    title: request.details.title,
                    description: request.details.description,
                    minimumAge: request.details.minimumAge,
                    theme: request.details.theme,
                    adminIds: [requester.id],
                    memberIds: [requester.id],
                    bannedUserIds: [],
                    roomIds: [],
                    createdAt: new Date().toISOString()
                });
            }
        }

        if (request.type === "joinGroup") {
            const group = await groupsCollection.findOne({
                id: request.targetGroupId
            });

            if (!group) {
                return res.status(404).json({ message: "Group not found." });
            }

            if (!group.adminIds.includes(actorId)) {
                return res.status(403).json({
                    message: "Only a Group Administrator can action this join request."
                });
            }

            if (status === "approved") {
                const user = await usersCollection.findOne({
                    id: request.requesterId
                });

                if (!user) {
                    return res.status(404).json({
                        message: "Requesting user no longer exists."
                    });
                }

                if (user.age < group.minimumAge) {
                    return res.status(403).json({
                        message: "User no longer meets the minimum age requirement."
                    });
                }

                if (group.bannedUserIds.includes(user.id)) {
                    return res.status(403).json({
                        message: "User is banned from this group."
                    });
                }

                await groupsCollection.updateOne(
                    { id: group.id },
                    { $addToSet: { memberIds: user.id } }
                );
            }
        }

        if (request.type === "roomCreation") {
            const group = await groupsCollection.findOne({
                id: request.targetGroupId
            });

            if (!group) {
                return res.status(404).json({ message: "Group not found." });
            }

            if (!group.adminIds.includes(actorId)) {
                return res.status(403).json({
                    message: "Only a Group Administrator can action this room request."
                });
            }

            if (status === "approved") {
                const room = {
                    id: crypto.randomUUID(),
                    groupId: group.id,
                    name: request.details.roomName,
                    createdAt: new Date().toISOString()
                };

                await roomsCollection.insertOne(room);
                await groupsCollection.updateOne(
                    { id: group.id },
                    { $addToSet: { roomIds: room.id } }
                );
            }
        }

        if (request.type === "groupBan") {
            const group = await groupsCollection.findOne({
                id: request.targetGroupId
            });

            if (!group) {
                return res.status(404).json({ message: "Group not found." });
            }

            if (!group.adminIds.includes(actorId)) {
                return res.status(403).json({
                    message: "Only a Group Administrator can action this ban request."
                });
            }

            if (actorId === request.requesterId) {
                return res.status(403).json({
                    message: "You cannot action a ban request that you submitted yourself."
                });
            }

            if (status === "approved") {
                const targetUserId = request.targetUserId;

                if (!group.memberIds.includes(targetUserId)) {
                    return res.status(400).json({
                        message: "Target user is no longer a member of this group."
                    });
                }

                if (
                    group.adminIds.includes(targetUserId) &&
                    group.adminIds.length <= 1
                ) {
                    return res.status(409).json({
                        message: "The only Group Administrator cannot be banned. Promote another administrator first."
                    });
                }

                await groupsCollection.updateOne(
                    { id: group.id },
                    {
                        $addToSet: { bannedUserIds: targetUserId },
                        $pull: {
                            memberIds: targetUserId,
                            adminIds: targetUserId
                        }
                    }
                );
            }
        }

        if (request.type === "systemBan") {
            const actor = await usersCollection.findOne({ id: actorId });

            if (!actor || actor.systemRole !== "superAdmin") {
                return res.status(403).json({
                    message: "Only the Super Administrator can action a system ban request."
                });
            }

            if (status === "approved") {
                const target = await usersCollection.findOne({
                    id: request.targetUserId
                });

                if (!target) {
                    return res.status(404).json({
                        message: "Target user no longer exists."
                    });
                }

                const administeredGroups = await groupsCollection.find({
                    adminIds: target.id
                }).toArray();

                const soleAdminGroup = administeredGroups.find(
                    group => group.adminIds.length === 1
                );

                if (soleAdminGroup) {
                    return res.status(409).json({
                        message: `User is the only administrator of "${soleAdminGroup.title}". Promote another administrator first.`
                    });
                }

                await groupsCollection.updateMany(
                    {
                        $or: [
                            { memberIds: target.id },
                            { adminIds: target.id }
                        ]
                    },
                    {
                        $pull: {
                            memberIds: target.id,
                            adminIds: target.id
                        }
                    }
                );

                await bannedUsersCollection.insertOne({
                    id: crypto.randomUUID(),
                    originalUserId: target.id,
                    firstName: target.firstName,
                    lastName: target.lastName,
                    email: target.email,
                    reason: request.reason,
                    bannedBy: actor.id,
                    bannedAt: new Date().toISOString()
                });

                await usersCollection.deleteOne({ id: target.id });
            }
        }

        if (request.type === "groupDeletion") {
            const actor = await usersCollection.findOne({ id: actorId });

            if (!actor || actor.systemRole !== "superAdmin") {
                return res.status(403).json({
                    message: "Only the Super Administrator can action group deletion requests."
                });
            }

            if (status === "approved") {
                const group = await groupsCollection.findOne({
                    id: request.targetGroupId
                });

                if (!group) {
                    return res.status(404).json({
                        message: "Group no longer exists."
                    });
                }

                if (!group.adminIds.includes(request.requesterId)) {
                    return res.status(409).json({
                        message: "The requester is no longer a Group Administrator of this group."
                    });
                }

                const roomIds = [...group.roomIds];

                await groupsCollection.deleteOne({ id: group.id });
                await roomsCollection.deleteMany({ groupId: group.id });

                if (roomIds.length > 0) {
                    await messagesCollection.deleteMany({
                        roomId: { $in: roomIds }
                    });
                }
            }
        }

        request.status = status;
        request.rejectionReason =
            status === "rejected"
                ? rejectionReason.trim()
                : null;

        await requestsCollection.updateOne(
            { id: request.id },
            {
                $set: {
                    status: request.status,
                    rejectionReason: request.rejectionReason
                }
            }
        );

        const auditLogs = [
            createAuditLog(
                status === "approved"
                    ? "requestApproved"
                    : "requestRejected",
                actorId,
                request.targetUserId ||
                    request.targetGroupId ||
                    request.requesterId,
                {
                    requestId: request.id,
                    requestType: request.type,
                    targetGroupId: request.targetGroupId,
                    rejectionReason: request.rejectionReason
                }
            )
        ];

        if (
            status === "approved" &&
            request.type === "groupDeletion"
        ) {
            auditLogs.push(
                createAuditLog(
                    "groupDeleted",
                    actorId,
                    request.targetGroupId,
                    {
                        groupTitle: request.details?.groupTitle,
                        requestId: request.id
                    }
                )
            );
        }

        if (
            status === "approved" &&
            request.type === "systemBan"
        ) {
            auditLogs.push(
                createAuditLog(
                    "systemBan",
                    actorId,
                    request.targetUserId,
                    {
                        reason: request.reason,
                        requestId: request.id
                    }
                )
            );
        }

        if (
            status === "approved" &&
            request.type === "groupBan"
        ) {
            auditLogs.push(
                createAuditLog(
                    "groupBan",
                    actorId,
                    request.targetUserId,
                    {
                        groupId: request.targetGroupId,
                        reason: request.reason,
                        requestId: request.id
                    }
                )
            );
        }

        await auditLogsCollection.insertMany(auditLogs);

        return res.json({
            message: `Request ${status} successfully.`,
            request
        });
    } catch (error) {
        console.error("Request action error:", error);
        return res.status(500).json({
            message: "Unable to action request."
        });
    }
});


module.exports = router;
