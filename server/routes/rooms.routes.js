const express = require("express");

const {
    readData,
    writeData
} = require("../utils/fileStore");

const crypto = require("crypto");

const router = express.Router();


// ==================================================
// HELPER — FIND ROOM
// ==================================================

function findRoom(
    data,
    roomId
) {

    return data.rooms.find(
        room =>
            room.id === roomId
    );
}


// ==================================================
// HELPER — FIND PARENT GROUP
// ==================================================

function findGroupForRoom(
    data,
    room
) {

    return data.groups.find(
        group =>
            group.id === room.groupId
    );
}


// ==================================================
// HELPER — CHECK ROOM ACCESS
// ==================================================

function canAccessRoom(
    data,
    room,
    userId
) {

    const group =
        findGroupForRoom(
            data,
            room
        );


    if (!group) {
        return false;
    }


    return group.memberIds.includes(
        userId
    );
}


// ==================================================
// Q — GET LAST MESSAGES
// ==================================================

router.get(
    "/:roomId/messages",
    function(req, res) {

        try {

            const data =
                readData();


            const room =
                findRoom(
                    data,
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
                data.users.find(
                    currentUser =>
                        currentUser.id ===
                        userId
                );


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


            if (
                !canAccessRoom(
                    data,
                    room,
                    user.id
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group."
                });
            }


            const group =
                findGroupForRoom(
                    data,
                    room
                );


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
                (data.messages || [])
                    .filter(
                        message =>
                            message.roomId ===
                                room.id
                            &&
                            message.deleted !==
                                true
                    )
                    .sort(
                        (a, b) =>
                            new Date(a.createdAt) -
                            new Date(b.createdAt)
                    );


            const lastMessages =
                messages.slice(
                    -limit
                );


            const enrichedMessages =
                lastMessages.map(
                    message => {

                        const sender =
                            data.users.find(
                                user =>
                                    user.id ===
                                    message.senderId
                            );


                        return {

                            ...message,

                            senderUsername:
                                sender?.username ||
                                "Unknown User",

                            senderIsAdmin:
                                group?.adminIds
                                    .includes(
                                        message.senderId
                                    )
                                || false
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
// Q — SEND MESSAGE
// ==================================================

router.post(
    "/:roomId/messages",
    function(req, res) {

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


            const data =
                readData();


            const room =
                findRoom(
                    data,
                    req.params.roomId
                );


            if (!room) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }


            const sender =
                data.users.find(
                    user =>
                        user.id ===
                        senderId
                );


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


            if (
                !canAccessRoom(
                    data,
                    room,
                    sender.id
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group."
                });
            }


            if (
                !Array.isArray(
                    data.messages
                )
            ) {
                data.messages = [];
            }


            const message = {

                id:
                    crypto.randomUUID(),

                roomId:
                    room.id,

                senderId:
                    sender.id,

                type,

                content:
                    content.trim(),

                createdAt:
                    new Date().toISOString(),

                deleted:
                    false
            };


            data.messages.push(
                message
            );


            writeData(data);


            const group =
                findGroupForRoom(
                    data,
                    room
                );


            return res.status(201).json({

                message:
                    "Message sent.",

                chatMessage: {

                    ...message,

                    senderUsername:
                        sender.username,

                    senderIsAdmin:
                        group?.adminIds
                            .includes(
                                sender.id
                            )
                        || false
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
// Q — DELETE OWN MESSAGE
// ==================================================

router.delete(
    "/:roomId/messages/:messageId",
    function(req, res) {

        try {

            const {
                actorId
            } = req.body;


            if (!actorId) {
                return res.status(400).json({
                    message:
                        "User is required."
                });
            }


            const data =
                readData();


            const room =
                findRoom(
                    data,
                    req.params.roomId
                );


            if (!room) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }


            const message =
                (data.messages || [])
                    .find(
                        currentMessage =>
                            currentMessage.id ===
                                req.params.messageId
                            &&
                            currentMessage.roomId ===
                                room.id
                    );


            if (!message) {
                return res.status(404).json({
                    message:
                        "Message not found."
                });
            }


            if (
                message.senderId !==
                actorId
            ) {
                return res.status(403).json({
                    message:
                        "You can only delete your own messages."
                });
            }


            message.deleted =
                true;


            writeData(data);


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
    function(req, res) {

        try {

            const data =
                readData();


            const room =
                findRoom(
                    data,
                    req.params.roomId
                );


            if (!room) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }


            return res.json(
                room
            );


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
    function(req, res) {

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


            const data =
                readData();


            const room =
                findRoom(
                    data,
                    req.params.roomId
                );


            if (!room) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }


            const group =
                findGroupForRoom(
                    data,
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


            room.name =
                name.trim();


            writeData(data);


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
    function(req, res) {

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


            const data =
                readData();


            const roomIndex =
                data.rooms.findIndex(
                    room =>
                        room.id ===
                        req.params.roomId
                );


            if (roomIndex === -1) {
                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }


            const room =
                data.rooms[
                    roomIndex
                ];


            const group =
                findGroupForRoom(
                    data,
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


            data.rooms.splice(
                roomIndex,
                1
            );


            group.roomIds =
                group.roomIds.filter(
                    roomId =>
                        roomId !==
                        room.id
                );


            if (
                Array.isArray(
                    data.messages
                )
            ) {

                data.messages =
                    data.messages.filter(
                        message =>
                            message.roomId !==
                            room.id
                    );
            }


            writeData(data);


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