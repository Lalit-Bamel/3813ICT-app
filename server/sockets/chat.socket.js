const { Server } = require("socket.io");
const crypto = require("crypto");

const { getDb } = require("../db/mongo");


/**
 * Configures all Socket.IO chat functionality.
 */
function initialiseChatSocket(httpServer) {

    const io = new Server(
        httpServer,
        {
            cors: {
                origin:
                    "http://localhost:4200",
                methods: [
                    "GET",
                    "POST"
                ]
            }
        }
    );


    io.on(
        "connection",
        function (socket) {

            console.log(
                `Socket connected: ${socket.id}`
            );


            // ==========================================
            // JOIN CHAT ROOM
            // ==========================================

            socket.on(
                "joinRoom",
                async function (
                    payload,
                    callback
                ) {

                    try {

                        const {
                            roomId,
                            userId
                        } = payload || {};

                        if (
                            !roomId ||
                            !userId
                        ) {

                            return callback?.({
                                success: false,
                                message:
                                    "Room and user are required."
                            });
                        }


                        const db =
                            getDb();

                        const roomsCollection =
                            db.collection("rooms");

                        const groupsCollection =
                            db.collection("groups");

                        const usersCollection =
                            db.collection("users");


                        const [
                            room,
                            user
                        ] =
                            await Promise.all([

                                roomsCollection
                                    .findOne({
                                        id: roomId
                                    }),

                                usersCollection
                                    .findOne({
                                        id: userId
                                    })
                            ]);


                        if (!room) {

                            return callback?.({
                                success: false,
                                message:
                                    "Room not found."
                            });
                        }


                        if (!user) {

                            return callback?.({
                                success: false,
                                message:
                                    "User not found."
                            });
                        }


                        if (
                            user.systemRole ===
                            "superAdmin"
                        ) {

                            return callback?.({
                                success: false,
                                message:
                                    "Super Administrator cannot access chat rooms."
                            });
                        }


                        const group =
                            await groupsCollection
                                .findOne({
                                    id:
                                        room.groupId
                                });


                        if (!group) {

                            return callback?.({
                                success: false,
                                message:
                                    "Parent group not found."
                            });
                        }


                        if (
                            !group.memberIds
                                .includes(user.id)
                        ) {

                            return callback?.({
                                success: false,
                                message:
                                    "You are not a member of this group."
                            });
                        }


                        // Leave the previously joined room
                        // before entering another one.
                        if (
                            socket.data.roomId &&
                            socket.data.roomId !==
                                room.id
                        ) {

                            const previousRoomId =
                                socket.data.roomId;

                            socket.leave(
                                previousRoomId
                            );

                            socket.to(
                                previousRoomId
                            ).emit(
                                "userLeft",
                                {
                                    userId:
                                        socket.data.userId,

                                    username:
                                        socket.data.username,

                                    roomId:
                                        previousRoomId
                                }
                            );
                        }


                        socket.join(
                            room.id
                        );


                        socket.data.roomId =
                            room.id;

                        socket.data.userId =
                            user.id;

                        socket.data.username =
                            user.username;


                        socket.to(
                            room.id
                        ).emit(
                            "userJoined",
                            {
                                userId:
                                    user.id,

                                username:
                                    user.username,

                                roomId:
                                    room.id
                            }
                        );


                        return callback?.({
                            success: true,
                            message:
                                "Joined room successfully."
                        });


                    } catch (error) {

                        console.error(
                            "Socket room join error:",
                            error
                        );


                        return callback?.({
                            success: false,
                            message:
                                "Unable to join room."
                        });
                    }
                }
            );


            // ==========================================
            // LEAVE CHAT ROOM
            // ==========================================

            socket.on(
                "leaveRoom",
                function (
                    payload,
                    callback
                ) {

                    try {

                        const roomId =
                            payload?.roomId;


                        if (
                            !roomId ||
                            socket.data.roomId !==
                                roomId
                        ) {

                            return callback?.({
                                success: false,
                                message:
                                    "You are not currently in this room."
                            });
                        }


                        socket.leave(
                            roomId
                        );


                        socket.to(
                            roomId
                        ).emit(
                            "userLeft",
                            {
                                userId:
                                    socket.data.userId,

                                username:
                                    socket.data.username,

                                roomId
                            }
                        );


                        socket.data.roomId =
                            null;


                        return callback?.({
                            success: true,
                            message:
                                "Left room successfully."
                        });


                    } catch (error) {

                        console.error(
                            "Socket room leave error:",
                            error
                        );


                        return callback?.({
                            success: false,
                            message:
                                "Unable to leave room."
                        });
                    }
                }
            );


            // ==========================================
            // SEND CHAT MESSAGE
            // ==========================================

            socket.on(
                "sendMessage",
                async function (
                    payload,
                    callback
                ) {

                    try {

                        const {
                            roomId,
                            senderId,
                            type,
                            content
                        } = payload || {};


                        if (
                            !roomId ||
                            !senderId ||
                            !type ||
                            !content?.trim()
                        ) {

                            return callback?.({
                                success: false,
                                message:
                                    "Room, sender, message type and content are required."
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

                            return callback?.({
                                success: false,
                                message:
                                    "Message type must be text, image or gif."
                            });
                        }


                        const db =
                            getDb();

                        const roomsCollection =
                            db.collection("rooms");

                        const groupsCollection =
                            db.collection("groups");

                        const usersCollection =
                            db.collection("users");

                        const messagesCollection =
                            db.collection("messages");


                        const [
                            room,
                            sender
                        ] =
                            await Promise.all([

                                roomsCollection
                                    .findOne({
                                        id: roomId
                                    }),

                                usersCollection
                                    .findOne({
                                        id: senderId
                                    })
                            ]);


                        if (!room) {

                            return callback?.({
                                success: false,
                                message:
                                    "Room not found."
                            });
                        }


                        if (!sender) {

                            return callback?.({
                                success: false,
                                message:
                                    "Sender not found."
                            });
                        }


                        if (
                            sender.systemRole ===
                            "superAdmin"
                        ) {

                            return callback?.({
                                success: false,
                                message:
                                    "Super Administrator cannot participate in chat."
                            });
                        }


                        const group =
                            await groupsCollection
                                .findOne({
                                    id:
                                        room.groupId
                                });


                        if (!group) {

                            return callback?.({
                                success: false,
                                message:
                                    "Parent group not found."
                            });
                        }


                        if (
                            !group.memberIds
                                .includes(sender.id)
                        ) {

                            return callback?.({
                                success: false,
                                message:
                                    "You are not a member of this group."
                            });
                        }


                        // Socket must actually be inside
                        // the requested Socket.IO room.
                        if (
                            !socket.rooms.has(
                                room.id
                            )
                        ) {

                            return callback?.({
                                success: false,
                                message:
                                    "Join the room before sending messages."
                            });
                        }


                        if (
                            socket.data.userId !==
                            sender.id
                        ) {

                            return callback?.({
                                success: false,
                                message:
                                    "Socket user does not match message sender."
                            });
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
                                new Date()
                                    .toISOString(),

                            deleted:
                                false
                        };


                        await messagesCollection
                            .insertOne(
                                message
                            );


                        const chatMessage = {

                            id:
                                message.id,

                            roomId:
                                message.roomId,

                            senderId:
                                message.senderId,

                            type:
                                message.type,

                            content:
                                message.content,

                            createdAt:
                                message.createdAt,

                            deleted:
                                message.deleted,

                            senderUsername:
                                sender.username,

                            senderIsAdmin:
                                group.adminIds
                                    .includes(
                                        sender.id
                                    )
                        };


                        io.to(
                            room.id
                        ).emit(
                            "newMessage",
                            chatMessage
                        );


                        return callback?.({
                            success: true,
                            message:
                                "Message sent successfully."
                        });


                    } catch (error) {

                        console.error(
                            "Socket message error:",
                            error
                        );


                        return callback?.({
                            success: false,
                            message:
                                "Unable to send message."
                        });
                    }
                }
            );


            // ==========================================
            // DISCONNECT
            // ==========================================

            socket.on(
                "disconnect",
                function () {

                    if (
                        socket.data.roomId
                    ) {

                        socket.to(
                            socket.data.roomId
                        ).emit(
                            "userLeft",
                            {
                                userId:
                                    socket.data.userId,

                                username:
                                    socket.data.username,

                                roomId:
                                    socket.data.roomId
                            }
                        );
                    }


                    console.log(
                        `Socket disconnected: ${socket.id}`
                    );
                }
            );
        }
    );


    return io;
}


module.exports = {
    initialiseChatSocket
};