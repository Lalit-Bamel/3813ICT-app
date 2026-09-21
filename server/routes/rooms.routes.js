const express = require("express");
const crypto = require("crypto");

const { getDb } = require("../db/mongo");

const router = express.Router();


// ==================================================
// HELPER — FIND ROOM
// ==================================================

/**
 * Finds a room using its application UUID.
 */
async function findRoom(
    roomsCollection,
    roomId
) {

    return roomsCollection.findOne({
        id: roomId
    });
}


// ==================================================
// HELPER — FIND PARENT GROUP
// ==================================================

/**
 * Finds the group that owns a room.
 */
async function findGroupForRoom(
    groupsCollection,
    room
) {

    return groupsCollection.findOne({
        id: room.groupId
    });
}


// ==================================================
// GET LAST MESSAGES
// ==================================================

router.get(
    "/:roomId/messages",
    async function (req, res) {

        try {

            const db = getDb();

            const roomsCollection =
                db.collection("rooms");

            const groupsCollection =
                db.collection("groups");

            const usersCollection =
                db.collection("users");

            const messagesCollection =
                db.collection("messages");

            const room =
                await findRoom(
                    roomsCollection,
                    req.params.roomId
                );

            if (!room) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }

            const userId =
                req.query.userId;

            if (!userId) {
                return res.status(400).json({
                    message:
                        "User is required."
                });
            }

            const user =
                await usersCollection.findOne({
                    id: userId
                });

            if (!user) {
                return res.status(404).json({
                    message:
                        "User not found."
                });
            }

            if (
                user.systemRole ===
                "superAdmin"
            ) {
                return res.status(403).json({
                    message:
                        "Super Administrator cannot access chat rooms."
                });
            }

            const group =
                await findGroupForRoom(
                    groupsCollection,
                    room
                );

            if (!group) {
                return res.status(404).json({
                    message:
                        "Parent group not found."
                });
            }

            if (
                !group.memberIds.includes(
                    user.id
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group."
                });
            }

            let limit =
                Number(
                    req.query.limit
                );

            if (
                !Number.isInteger(limit) ||
                limit <= 0
            ) {
                limit = 5;
            }

            if (limit > 50) {
                limit = 50;
            }

            const messages =
                await messagesCollection
                    .find(
                        {
                            roomId:
                                room.id,
                            deleted: {
                                $ne: true
                            }
                        },
                        {
                            projection: {
                                _id: 0
                            }
                        }
                    )
                    .sort({
                        createdAt: -1
                    })
                    .limit(limit)
                    .toArray();

            messages.reverse();

            const senderIds = [
                ...new Set(
                    messages.map(
                        message =>
                            message.senderId
                    )
                )
            ];

            const senders =
                await usersCollection
                    .find(
                        {
                            id: {
                                $in:
                                    senderIds
                            }
                        },
                        {
                            projection: {
                                _id: 0,
                                id: 1,
                                username: 1,
                                profilePicture: 1
                            }
                        }
                    )
                    .toArray();

            const senderMap =
                new Map(
                    senders.map(
                        sender => [
                            sender.id,
                            sender
                        ]
                    )
                );

            const enrichedMessages =
                messages.map(
                    message => {

                        const sender =
                            senderMap.get(
                                message.senderId
                            );

                        return {
                            ...message,

                            senderUsername:
                                sender?.username ||
                                "Unknown User",

                            senderProfilePicture:
                                sender?.profilePicture ||
                                "",
                            senderIsAdmin:
                                group.adminIds
                                    .includes(
                                        message.senderId
                                    )
                        };
                    }
                );

            return res.json(
                enrichedMessages
            );

        } catch (error) {

            console.error(
                "Message retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve messages."
            });
        }
    }
);


// ==================================================
// SEND MESSAGE
// ==================================================

router.post(
    "/:roomId/messages",
    async function (req, res) {

        try {

            const {
                senderId,
                type,
                content
            } = req.body;

            if (
                !senderId ||
                !type ||
                !content?.trim()
            ) {
                return res.status(400).json({
                    message:
                        "Sender, message type and content are required."
                });
            }

            const allowedTypes = [
                "text",
                "image",
                "gif"
            ];

            if (
                !allowedTypes.includes(
                    type
                )
            ) {
                return res.status(400).json({
                    message:
                        "Message type must be text, image or gif."
                });
            }

            const db = getDb();

            const roomsCollection =
                db.collection("rooms");

            const groupsCollection =
                db.collection("groups");

            const usersCollection =
                db.collection("users");

            const messagesCollection =
                db.collection("messages");

            const room =
                await findRoom(
                    roomsCollection,
                    req.params.roomId
                );

            if (!room) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }

            const sender =
                await usersCollection.findOne({
                    id: senderId
                });

            if (!sender) {
                return res.status(404).json({
                    message:
                        "Sender not found."
                });
            }

            if (
                sender.systemRole ===
                "superAdmin"
            ) {
                return res.status(403).json({
                    message:
                        "Super Administrator cannot participate in chat."
                });
            }

            const group =
                await findGroupForRoom(
                    groupsCollection,
                    room
                );

            if (!group) {
                return res.status(404).json({
                    message:
                        "Parent group not found."
                });
            }

            if (
                !group.memberIds.includes(
                    sender.id
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group."
                });
            }

            const message = {
                id: crypto.randomUUID(),
                roomId: room.id,
                senderId: sender.id,
                type,
                content:
                    content.trim(),
                createdAt:
                    new Date().toISOString(),
                deleted:
                    false
            };

            await messagesCollection.insertOne(
                message
            );

            const {
                _id,
                ...safeMessage
            } = message;

            return res.status(201).json({
                message:
                    "Message sent.",

                chatMessage: {
                    ...safeMessage,

                    senderUsername:
                        sender.username,

                    senderIsAdmin:
                        group.adminIds
                            .includes(
                                sender.id
                            )
                }
            });

        } catch (error) {

            console.error(
                "Message creation error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to send message."
            });
        }
    }
);


// ==================================================
// DELETE OWN MESSAGE
// ==================================================

router.delete(
    "/:roomId/messages/:messageId",
    async function (req, res) {

        try {

            const {
                roomId,
                messageId
            } = req.params;


            const {
                actorId
            } = req.body;


            if (!actorId) {

                return res.status(400).json({
                    message:
                        "User is required."
                });
            }


            const db =
                getDb();


            const roomsCollection =
                db.collection("rooms");


            const messagesCollection =
                db.collection("messages");


            // ======================================
            // FIND ROOM
            // ======================================

            const room =
                await findRoom(
                    roomsCollection,
                    roomId
                );


            if (!room) {

                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }


            // ======================================
            // FIND MESSAGE
            // ======================================

            const message =
                await messagesCollection.findOne({

                    id:
                        messageId,

                    roomId:
                        room.id
                });


            if (!message) {

                return res.status(404).json({
                    message:
                        "Message not found."
                });
            }


            // ======================================
            // VERIFY OWNERSHIP
            // ======================================

            if (
                message.senderId !==
                actorId
            ) {

                return res.status(403).json({
                    message:
                        "You can only delete your own messages."
                });
            }


            // ======================================
            // SOFT DELETE MESSAGE
            // ======================================

            await messagesCollection.updateOne(
                {
                    id:
                        message.id
                },
                {
                    $set: {
                        deleted:
                            true
                    }
                }
            );


            // ======================================
            // BROADCAST REAL-TIME DELETION
            // ======================================

            const io =
                req.app.get("io");


            if (io) {

                io.to(
                    roomId
                ).emit(
                    "messageDeleted",
                    {
                        roomId,
                        messageId
                    }
                );
            }


            return res.json({
                message:
                    "Message deleted successfully."
            });


        } catch (error) {

            console.error(
                "Message deletion error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to delete message."
            });
        }
    }
);

// ==================================================
// GET ONE ROOM
// ==================================================

router.get(
    "/:roomId",
    async function (req, res) {

        try {

            const db = getDb();

            const room =
                await db.collection("rooms")
                    .findOne(
                        {
                            id:
                                req.params.roomId
                        },
                        {
                            projection: {
                                _id: 0
                            }
                        }
                    );

            if (!room) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }

            return res.json(room);

        } catch (error) {

            console.error(
                "Room retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve room."
            });
        }
    }
);


// ==================================================
// RENAME ROOM
// ==================================================

router.put(
    "/:roomId",
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

            const roomsCollection =
                db.collection("rooms");

            const groupsCollection =
                db.collection("groups");

            const room =
                await findRoom(
                    roomsCollection,
                    req.params.roomId
                );

            if (!room) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }

            const group =
                await findGroupForRoom(
                    groupsCollection,
                    room
                );

            if (!group) {
                return res.status(404).json({
                    message:
                        "Parent group not found."
                });
            }

            if (
                !group.adminIds.includes(
                    actorId
                )
            ) {
                return res.status(403).json({
                    message:
                        "Only a Group Administrator can edit this room."
                });
            }

            const cleanName =
                name.trim();

            await roomsCollection.updateOne(
                {
                    id:
                        room.id
                },
                {
                    $set: {
                        name:
                            cleanName
                    }
                }
            );

            room.name =
                cleanName;

            delete room._id;

            return res.json({
                message:
                    "Room updated successfully.",
                room
            });

        } catch (error) {

            console.error(
                "Room update error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to update room."
            });
        }
    }
);


// ==================================================
// DELETE ROOM
// ==================================================

router.delete(
    "/:roomId",
    async function (req, res) {

        try {

            const {
                actorId
            } = req.body;

            if (!actorId) {
                return res.status(400).json({
                    message:
                        "Administrator is required."
                });
            }

            const db = getDb();

            const roomsCollection =
                db.collection("rooms");

            const groupsCollection =
                db.collection("groups");

            const messagesCollection =
                db.collection("messages");

            const room =
                await findRoom(
                    roomsCollection,
                    req.params.roomId
                );

            if (!room) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }

            const group =
                await findGroupForRoom(
                    groupsCollection,
                    room
                );

            if (!group) {
                return res.status(404).json({
                    message:
                        "Parent group not found."
                });
            }

            if (
                !group.adminIds.includes(
                    actorId
                )
            ) {
                return res.status(403).json({
                    message:
                        "Only a Group Administrator can delete this room."
                });
            }

            await roomsCollection.deleteOne({
                id:
                    room.id
            });

            await groupsCollection.updateOne(
                {
                    id:
                        group.id
                },
                {
                    $pull: {
                        roomIds:
                            room.id
                    }
                }
            );

            await messagesCollection.deleteMany({
                roomId:
                    room.id
            });

            return res.json({
                message:
                    "Room deleted successfully."
            });

        } catch (error) {

            console.error(
                "Room deletion error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to delete room."
            });
        }
    }
);

module.exports = router;