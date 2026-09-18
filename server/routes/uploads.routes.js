const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { getDb } = require("../db/mongo");

const router = express.Router();


// ==================================================
// MULTER CONFIGURATION
// ==================================================

const upload = multer({

    storage:
        multer.memoryStorage(),

    limits: {
        fileSize:
            5 * 1024 * 1024
    },

    fileFilter:
        function (
            req,
            file,
            callback
        ) {

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp"
            ];


            if (
                !allowedTypes.includes(
                    file.mimetype
                )
            ) {

                return callback(
                    new Error(
                        "Only JPG, PNG, GIF and WEBP images are allowed."
                    )
                );
            }


            callback(
                null,
                true
            );
        }
});


// ==================================================
// HELPER — FILE EXTENSION
// ==================================================

function getExtension(
    mimeType
) {

    const extensions = {

        "image/jpeg":
            ".jpg",

        "image/png":
            ".png",

        "image/gif":
            ".gif",

        "image/webp":
            ".webp"
    };


    return extensions[mimeType];
}


// ==================================================
// UPLOAD CHAT IMAGE
// ==================================================

router.post(
    "/chat-image",
    upload.single("image"),
    async function (
        req,
        res
    ) {

        try {

            const {
                roomId,
                senderId
            } = req.body;


            if (
                !roomId ||
                !senderId
            ) {

                return res.status(400).json({
                    message:
                        "Room and sender are required."
                });
            }


            if (!req.file) {

                return res.status(400).json({
                    message:
                        "An image file is required."
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

                    roomsCollection.findOne({
                        id:
                            roomId
                    }),

                    usersCollection.findOne({
                        id:
                            senderId
                    })
                ]);


            if (!room) {

                return res.status(404).json({
                    message:
                        "Room not found."
                });
            }


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
                await groupsCollection.findOne({
                    id:
                        room.groupId
                });


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


            const extension =
                getExtension(
                    req.file.mimetype
                );


            const fileName =
                `${crypto.randomUUID()}${extension}`;


            const uploadDirectory =
                path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "chat"
                );


            await fs.promises.mkdir(
                uploadDirectory,
                {
                    recursive: true
                }
            );


            const filePath =
                path.join(
                    uploadDirectory,
                    fileName
                );


            await fs.promises.writeFile(
                filePath,
                req.file.buffer
            );


            const publicPath =
                `/uploads/chat/${fileName}`;


            const message = {

                id:
                    crypto.randomUUID(),

                roomId:
                    room.id,

                senderId:
                    sender.id,

                type:
                    "image",

                content:
                    publicPath,

                imageMetadata: {

                    fileName,

                    originalName:
                        req.file.originalname,

                    mimeType:
                        req.file.mimetype,

                    size:
                        req.file.size
                },

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

                imageMetadata:
                    message.imageMetadata,

                createdAt:
                    message.createdAt,

                deleted:
                    message.deleted,

                senderUsername:
                    sender.username,

                senderIsAdmin:
                    group.adminIds.includes(
                        sender.id
                    )
            };


            const io =
                req.app.get("io");


            if (io) {

                io.to(
                    room.id
                ).emit(
                    "newMessage",
                    chatMessage
                );
            }


            return res.status(201).json({

                message:
                    "Image sent successfully.",

                chatMessage
            });


        } catch (error) {

            console.error(
                "Chat image upload error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to upload image."
            });
        }
    }
);

// ==================================================
// UPLOAD PROFILE IMAGE
// ==================================================

router.post(
    "/profile-image",
    upload.single("image"),
    async function (
        req,
        res
    ) {

        try {

            const {
                userId
            } = req.body;


            if (!userId) {

                return res.status(400).json({
                    message:
                        "User is required."
                });
            }


            if (!req.file) {

                return res.status(400).json({
                    message:
                        "A profile image is required."
                });
            }


            const db =
                getDb();


            const usersCollection =
                db.collection("users");


            const user =
                await usersCollection.findOne({
                    id:
                        userId
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
                        "Super Administrator cannot upload a profile picture."
                });
            }


            const extension =
                getExtension(
                    req.file.mimetype
                );


            const fileName =
                `${crypto.randomUUID()}${extension}`;


            const uploadDirectory =
                path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "profiles"
                );


            await fs.promises.mkdir(
                uploadDirectory,
                {
                    recursive: true
                }
            );


            const filePath =
                path.join(
                    uploadDirectory,
                    fileName
                );


            await fs.promises.writeFile(
                filePath,
                req.file.buffer
            );


            const publicPath =
                `/uploads/profiles/${fileName}`;


            const profilePictureMetadata = {

                fileName,

                originalName:
                    req.file.originalname,

                mimeType:
                    req.file.mimetype,

                size:
                    req.file.size,

                uploadedAt:
                    new Date()
                        .toISOString()
            };


            await usersCollection.updateOne(
                {
                    id:
                        user.id
                },
                {
                    $set: {

                        profilePicture:
                            publicPath,

                        profilePictureMetadata
                    }
                }
            );


            const updatedUser = {

                ...user,

                profilePicture:
                    publicPath,

                profilePictureMetadata
            };


            delete updatedUser._id;

            delete updatedUser.passwordHash;


            return res.status(201).json({

                message:
                    "Profile picture updated successfully.",

                user:
                    updatedUser
            });


        } catch (error) {

            console.error(
                "Profile image upload error:",
                error
            );


            return res.status(500).json({
                message:
                    "Unable to upload profile picture."
            });
        }
    }
);


// ==================================================
// MULTER ERROR HANDLER
// ==================================================

router.use(
    function (
        error,
        req,
        res,
        next
    ) {

        if (
            error instanceof
            multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({
                    message:
                        "Image must be 5 MB or smaller."
                });
            }


            return res.status(400).json({
                message:
                    error.message
            });
        }


        if (error) {

            return res.status(400).json({
                message:
                    error.message
            });
        }


        next();
    }
);


module.exports = router;