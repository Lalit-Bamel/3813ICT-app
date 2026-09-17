const express = require("express");
const crypto = require("crypto");

const { getDb } = require("../db/mongo");

const router = express.Router();


// ==================================================
// GET ALL GROUPS
// ==================================================

router.get("/", async function (req, res) {

    try {

        const db = getDb();

        const groups = await db
            .collection("groups")
            .find(
                {},
                {
                    projection: {
                        _id: 0
                    }
                }
            )
            .toArray();

        return res.json(groups);

    } catch (error) {

        console.error(
            "Group retrieval error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to retrieve groups."
        });
    }
});


// ==================================================
// GET ROOMS FOR A GROUP
// ==================================================

router.get(
    "/:groupId/rooms",
    async function (req, res) {

        try {

            const db = getDb();

            const group =
                await db.collection("groups")
                    .findOne({
                        id: req.params.groupId
                    });

            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found."
                });
            }

            const rooms =
                await db.collection("rooms")
                    .find(
                        {
                            groupId: group.id
                        },
                        {
                            projection: {
                                _id: 0
                            }
                        }
                    )
                    .toArray();

            return res.json(rooms);

        } catch (error) {

            console.error(
                "Room retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve rooms."
            });
        }
    }
);


// ==================================================
// GROUP ADMIN DIRECTLY CREATES ROOM
// ==================================================

router.post(
    "/:groupId/rooms",
    async function (req, res) {

        try {

            const {
                actorId,
                name
            } = req.body;

            if (
                !actorId ||
                !name?.trim()
            ) {
                return res.status(400).json({
                    message:
                        "Administrator and room name are required."
                });
            }

            const db = getDb();

            const groupsCollection =
                db.collection("groups");

            const roomsCollection =
                db.collection("rooms");

            const group =
                await groupsCollection.findOne({
                    id: req.params.groupId
                });

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
                        "Only a Group Administrator can create rooms."
                });
            }

            const room = {
                id: crypto.randomUUID(),
                groupId: group.id,
                name: name.trim(),
                createdAt:
                    new Date().toISOString()
            };

            await roomsCollection.insertOne(
                room
            );

            await groupsCollection.updateOne(
                {
                    id: group.id
                },
                {
                    $push: {
                        roomIds: room.id
                    }
                }
            );

            const {
                _id,
                ...safeRoom
            } = room;

            return res.status(201).json({
                message:
                    "Room created successfully.",
                room: safeRoom
            });

        } catch (error) {

            console.error(
                "Room creation error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to create room."
            });
        }
    }
);


// ==================================================
// GET GROUP MEMBERS
// ==================================================

router.get(
    "/:groupId/members",
    async function (req, res) {

        try {

            const db = getDb();

            const group =
                await db.collection("groups")
                    .findOne({
                        id: req.params.groupId
                    });

            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found."
                });
            }

            const members =
                await db.collection("users")
                    .find(
                        {
                            id: {
                                $in:
                                    group.memberIds || []
                            }
                        },
                        {
                            projection: {
                                _id: 0,
                                id: 1,
                                username: 1
                            }
                        }
                    )
                    .toArray();

            return res.json(members);

        } catch (error) {

            console.error(
                "Group member retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve group members."
            });
        }
    }
);


// ==================================================
// GROUP ADMIN RESIGNS
// ==================================================

router.post(
    "/:groupId/admins/resign",
    async function (req, res) {

        try {

            const actorId =
                req.body.actorId;

            const db = getDb();

            const groupsCollection =
                db.collection("groups");

            const group =
                await groupsCollection.findOne({
                    id: req.params.groupId
                });

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
                        "You are not a Group Administrator."
                });
            }

            if (
                group.adminIds.length <= 1
            ) {
                return res.status(409).json({
                    message:
                        "You cannot resign because the group must always have at least one administrator."
                });
            }

            await groupsCollection.updateOne(
                {
                    id: group.id
                },
                {
                    $pull: {
                        adminIds:
                            actorId
                    }
                }
            );

            group.adminIds =
                group.adminIds.filter(
                    adminId =>
                        adminId !== actorId
                );

            delete group._id;

            return res.json({
                message:
                    "You have resigned as Group Administrator.",
                group
            });

        } catch (error) {

            console.error(
                "Admin resignation error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to resign as administrator."
            });
        }
    }
);


// ==================================================
// PROMOTE MEMBER TO GROUP ADMIN
// ==================================================

router.post(
    "/:groupId/admins/:userId",
    async function (req, res) {

        try {

            const actorId =
                req.body.actorId;

            const targetUserId =
                req.params.userId;

            const db = getDb();

            const groupsCollection =
                db.collection("groups");

            const group =
                await groupsCollection.findOne({
                    id: req.params.groupId
                });

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
                        "Only a Group Administrator can promote members."
                });
            }

            if (
                !group.memberIds.includes(
                    targetUserId
                )
            ) {
                return res.status(400).json({
                    message:
                        "Only an existing group member can be promoted."
                });
            }

            if (
                group.adminIds.includes(
                    targetUserId
                )
            ) {
                return res.status(409).json({
                    message:
                        "This user is already a Group Administrator."
                });
            }

            await groupsCollection.updateOne(
                {
                    id: group.id
                },
                {
                    $push: {
                        adminIds:
                            targetUserId
                    }
                }
            );

            group.adminIds.push(
                targetUserId
            );

            delete group._id;

            return res.json({
                message:
                    "Member promoted to Group Administrator.",
                group
            });

        } catch (error) {

            console.error(
                "Admin promotion error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to promote member."
            });
        }
    }
);


// ==================================================
// DEMOTE GROUP ADMIN
// ==================================================

router.delete(
    "/:groupId/admins/:userId",
    async function (req, res) {

        try {

            const actorId =
                req.body.actorId;

            const targetUserId =
                req.params.userId;

            const db = getDb();

            const groupsCollection =
                db.collection("groups");

            const group =
                await groupsCollection.findOne({
                    id: req.params.groupId
                });

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
                        "Only a Group Administrator can demote administrators."
                });
            }

            if (
                targetUserId === actorId
            ) {
                return res.status(400).json({
                    message:
                        "Use the resign option to remove your own administrator role."
                });
            }

            if (
                !group.adminIds.includes(
                    targetUserId
                )
            ) {
                return res.status(400).json({
                    message:
                        "This user is not a Group Administrator."
                });
            }

            if (
                group.adminIds.length <= 1
            ) {
                return res.status(409).json({
                    message:
                        "A group must always have at least one administrator."
                });
            }

            await groupsCollection.updateOne(
                {
                    id: group.id
                },
                {
                    $pull: {
                        adminIds:
                            targetUserId
                    }
                }
            );

            group.adminIds =
                group.adminIds.filter(
                    adminId =>
                        adminId !== targetUserId
                );

            delete group._id;

            return res.json({
                message:
                    "Group Administrator demoted successfully.",
                group
            });

        } catch (error) {

            console.error(
                "Admin demotion error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to demote administrator."
            });
        }
    }
);


// ==================================================
// EDIT GROUP
// ==================================================

router.put(
    "/:groupId",
    async function (req, res) {

        try {

            const {
                actorId,
                title,
                description,
                minimumAge,
                theme
            } = req.body;

            if (
                !actorId ||
                !title ||
                !description ||
                minimumAge === undefined ||
                !theme
            ) {
                return res.status(400).json({
                    message:
                        "All group fields are required."
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

            const db = getDb();

            const groupsCollection =
                db.collection("groups");

            const usersCollection =
                db.collection("users");

            const group =
                await groupsCollection.findOne({
                    id: req.params.groupId
                });

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
                        "Only a Group Administrator can edit this group."
                });
            }

            const eligibleUsers =
                await usersCollection
                    .find(
                        {
                            id: {
                                $in:
                                    group.memberIds || []
                            },
                            age: {
                                $gte:
                                    numericAge
                            }
                        },
                        {
                            projection: {
                                _id: 0,
                                id: 1
                            }
                        }
                    )
                    .toArray();

            const eligibleMemberIds =
                eligibleUsers.map(
                    user => user.id
                );

            const eligibleAdminIds =
                group.adminIds.filter(
                    adminId =>
                        eligibleMemberIds.includes(
                            adminId
                        )
                );

            if (
                eligibleAdminIds.length === 0
            ) {
                return res.status(409).json({
                    message:
                        "Minimum age cannot be changed because it would remove every Group Administrator."
                });
            }

            const updatedFields = {
                title:
                    cleanTitle,
                description:
                    cleanDescription,
                minimumAge:
                    numericAge,
                theme,
                memberIds:
                    eligibleMemberIds,
                adminIds:
                    eligibleAdminIds
            };

            await groupsCollection.updateOne(
                {
                    id: group.id
                },
                {
                    $set:
                        updatedFields
                }
            );

            const updatedGroup = {
                ...group,
                ...updatedFields
            };

            delete updatedGroup._id;

            return res.json({
                message:
                    "Group updated successfully.",
                group:
                    updatedGroup
            });

        } catch (error) {

            console.error(
                "Group update error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to update group."
            });
        }
    }
);


// ==================================================
// GET ONE GROUP
// ==================================================

router.get(
    "/:groupId",
    async function (req, res) {

        try {

            const db = getDb();

            const group =
                await db.collection("groups")
                    .findOne(
                        {
                            id:
                                req.params.groupId
                        },
                        {
                            projection: {
                                _id: 0
                            }
                        }
                    );

            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found."
                });
            }

            return res.json(group);

        } catch (error) {

            console.error(
                "Group retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve group."
            });
        }
    }
);

module.exports = router;