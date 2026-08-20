const express = require("express");

const {
    readData,
    writeData
} = require("../utils/fileStore");

const router = express.Router();


// GET ONE ROOM
router.get("/:roomId", function(req, res) {

    try {

        const data = readData();


        const room = data.rooms.find(
            currentRoom =>
                currentRoom.id ===
                req.params.roomId
        );


        if (!room) {

            return res.status(404).json({
                message: "Room not found."
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
});


// RENAME ROOM
router.put("/:roomId", function(req, res) {

    try {

        const {
            actorId,
            name
        } = req.body;


        if (!actorId || !name?.trim()) {

            return res.status(400).json({
                message:
                    "Administrator and room name are required."
            });
        }


        const data = readData();


        const room = data.rooms.find(
            currentRoom =>
                currentRoom.id ===
                req.params.roomId
        );


        if (!room) {

            return res.status(404).json({
                message:
                    "Room not found."
            });
        }


        const group = data.groups.find(
            currentGroup =>
                currentGroup.id ===
                room.groupId
        );


        if (!group) {

            return res.status(404).json({
                message:
                    "Parent group not found."
            });
        }


        if (
            !group.adminIds.includes(actorId)
        ) {

            return res.status(403).json({
                message:
                    "Only a Group Administrator can edit this room."
            });
        }


        room.name = name.trim();


        writeData(data);


        return res.json({

            message:
                "Room updated successfully.",

            room: room
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
});


// DELETE ROOM
router.delete("/:roomId", function(req, res) {

    try {

        const actorId =
            req.body.actorId;


        if (!actorId) {

            return res.status(400).json({
                message:
                    "Administrator is required."
            });
        }


        const data = readData();


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
            data.rooms[roomIndex];


        const group =
            data.groups.find(
                currentGroup =>
                    currentGroup.id ===
                    room.groupId
            );


        if (!group) {

            return res.status(404).json({
                message:
                    "Parent group not found."
            });
        }


        if (
            !group.adminIds.includes(actorId)
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
                    roomId !== room.id
            );


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
});


module.exports = router;