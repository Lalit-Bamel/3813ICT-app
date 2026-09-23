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


    /**
     * Returns the valid, connected users in a room.
     *
     * Socket.IO already tracks the sockets in each room. We use that
     * information as the presence source, then check MongoDB membership
     * before sending the list to clients. A Set deduplicates users who
     * have the same account open in more than one tab.
     */
    async function getRoomUsers(roomId) {

        const connectedSockets =
            await io.in(roomId)
                .fetchSockets();

        const connectedUserIds = [
            ...new Set(
                connectedSockets
                    .map(connectedSocket =>
                        connectedSocket.data.userId
                    )
                    .filter(Boolean)
            )
        ];


        if (connectedUserIds.length === 0) {
            return [];
        }


        const db = getDb();

        const room =
            await db.collection("rooms")
                .findOne({ id: roomId });


        if (!room) {
            return [];
        }


        const group =
            await db.collection("groups")
                .findOne({ id: room.groupId });


        if (!group) {
            return [];
        }


        const memberIds =
            new Set(group.memberIds || []);

        const bannedUserIds =
            new Set(group.bannedUserIds || []);

        const validUserIds =
            connectedUserIds.filter(userId =>
                memberIds.has(userId) &&
                !bannedUserIds.has(userId)
            );


        if (validUserIds.length === 0) {
            return [];
        }


        const users =
            await db.collection("users")
                .find({
                    id: {
                        $in: validUserIds
                    },
                    systemRole: {
                        $ne: "superAdmin"
                    }
                })
                .project({
                    _id: 0,
                    id: 1,
                    username: 1
                })
                .toArray();


        return users
            .map(user => ({
                userId: user.id,
                username: user.username
            }))
            .sort((firstUser, secondUser) =>
                firstUser.username.localeCompare(
                    secondUser.username
                )
            );
    }


    async function emitRoomUsers(roomId) {

        try {

            const users =
                await getRoomUsers(roomId);


            io.to(roomId).emit(
                "roomUsersUpdated",
                {
                    roomId,
                    users
                }
            );

        } catch (error) {

            console.error(
                "Room presence update error:",
                error
            );
        }
    }


    async function isUserInRoom(
        roomId,
        userId
    ) {

        const connectedSockets =
            await io.in(roomId)
                .fetchSockets();


        return connectedSockets.some(
            connectedSocket =>
                connectedSocket.data.userId ===
                    userId
        );
    }


    async function notifyRoomDeparture(
        roomId,
        userId,
        username
    ) {

        const userStillPresent =
            await isUserInRoom(
                roomId,
                userId
            );


        if (!userStillPresent) {

            io.to(roomId).emit(
                "userLeft",
                {
                    userId,
                    username,
                    roomId
                }
            );
        }


        await emitRoomUsers(roomId);
    }


    io.on(
        "connection",
        function (socket) {

            console.log(
                `Socket connected: ${socket.id}`
            );


            // ==========================================
            // SUBSCRIBE TO USER-SPECIFIC UPDATES
            // ==========================================

            socket.on(
                "subscribeToUser",
                async function (
                    payload,
                    callback
                ) {

                    try {

                        const userId =
                            payload?.userId;

                        if (!userId) {
                            return callback?.({
                                success: false,
                                message:
                                    "User is required."
                            });
                        }

                        const user =
                            await getDb()
                                .collection("users")
                                .findOne({ id: userId });

                        if (!user) {
                            return callback?.({
                                success: false,
                                message:
                                    "User could not be verified."
                            });
                        }

                        socket.join(
                            `user:${userId}`
                        );

                        return callback?.({
                            success: true,
                            message:
                                "Subscribed to user updates."
                        });

                    } catch (error) {

                        console.error(
                            "User subscription error:",
                            error
                        );

                        return callback?.({
                            success: false,
                            message:
                                "Unable to subscribe to user updates."
                        });
                    }
                }
            );


            socket.on(
                "unsubscribeFromUser",
                function (payload) {

                    if (payload?.userId) {
                        socket.leave(
                            `user:${payload.userId}`
                        );
                    }
                }
            );


            // ==========================================
            // SUBSCRIBE TO GROUP UPDATES
            // ==========================================

            socket.on(
                "subscribeToGroup",
                async function (
                    payload,
                    callback
                ) {

                    try {

                        const {
                            groupId,
                            userId
                        } = payload || {};

                        if (!groupId || !userId) {
                            return callback?.({
                                success: false,
                                message:
                                    "Group and user are required."
                            });
                        }

                        const db = getDb();

                        const [group, user] =
                            await Promise.all([
                                db.collection("groups")
                                    .findOne({ id: groupId }),
                                db.collection("users")
                                    .findOne({ id: userId })
                            ]);

                        if (!group || !user) {
                            return callback?.({
                                success: false,
                                message:
                                    "Group membership could not be verified."
                            });
                        }

                        if (
                            !group.memberIds.includes(userId) ||
                            group.bannedUserIds.includes(userId)
                        ) {
                            return callback?.({
                                success: false,
                                message:
                                    "You are not a member of this group."
                            });
                        }

                        socket.join(
                            `group:${groupId}`
                        );

                        return callback?.({
                            success: true,
                            message:
                                "Subscribed to group updates."
                        });

                    } catch (error) {

                        console.error(
                            "Group subscription error:",
                            error
                        );

                        return callback?.({
                            success: false,
                            message:
                                "Unable to subscribe to group updates."
                        });
                    }
                }
            );


            socket.on(
                "unsubscribeFromGroup",
                function (payload) {

                    if (payload?.groupId) {
                        socket.leave(
                            `group:${payload.groupId}`
                        );
                    }
                }
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
                                .includes(user.id) ||
                            group.bannedUserIds
                                ?.includes(user.id)
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
                            (
                                socket.data.roomId !==
                                    room.id ||
                                socket.data.userId !==
                                    user.id
                            )
                        ) {

                            const previousRoomId =
                                socket.data.roomId;

                            const previousUserId =
                                socket.data.userId;

                            const previousUsername =
                                socket.data.username;

                            socket.leave(
                                previousRoomId
                            );

                            await notifyRoomDeparture(
                                previousRoomId,
                                previousUserId,
                                previousUsername
                            );
                        }


                        const userAlreadyPresent =
                            await isUserInRoom(
                                room.id,
                                user.id
                            );


                        socket.join(
                            room.id
                        );


                        socket.data.roomId =
                            room.id;

                        socket.data.userId =
                            user.id;

                        socket.data.username =
                            user.username;


                        if (!userAlreadyPresent) {

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
                        }


                        await emitRoomUsers(
                            room.id
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
                async function (
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

                        await notifyRoomDeparture(
                            roomId,
                            socket.data.userId,
                            socket.data.username
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
                            senderProfilePicture:
                                sender.profilePicture ||
                                "",

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
                async function () {

                    if (
                        socket.data.roomId
                    ) {

                        await notifyRoomDeparture(
                            socket.data.roomId,
                            socket.data.userId,
                            socket.data.username
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
