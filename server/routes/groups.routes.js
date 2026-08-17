const express = require("express");

const crypto = require("crypto");

const {
    readData,
    writeData
} = require("../utils/fileStore");

const router = express.Router();


// GET ALL GROUPS
router.get("/", function(req, res) {
    try {
        const data = readData();

        return res.json(data.groups);

    } catch (error) {
        console.error("Group retrieval error:", error);

        return res.status(500).json({
            message: "Unable to retrieve groups."
        });
    }
});


// GET ROOMS FOR A GROUP
router.get("/:groupId/rooms", function(req, res) {

    try {

        const data = readData();


        const group = data.groups.find(
            currentGroup =>
                currentGroup.id ===
                req.params.groupId
        );


        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }


        const rooms = data.rooms.filter(
            room =>
                room.groupId === group.id
        );


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
});


// GROUP ADMIN DIRECTLY CREATES ROOM
router.post("/:groupId/rooms", function(req, res) {

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


        const group = data.groups.find(
            currentGroup =>
                currentGroup.id ===
                req.params.groupId
        );


        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }


        if (!group.adminIds.includes(actorId)) {
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


        data.rooms.push(room);

        group.roomIds.push(room.id);


        writeData(data);


        return res.status(201).json({
            message:
                "Room created successfully.",
            room: room
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
});


// GET ONE GROUP
router.get("/:groupId", function(req, res) {
    try {
        const data = readData();

        const group = data.groups.find(
            currentGroup =>
                currentGroup.id === req.params.groupId
        );

        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }

        return res.json(group);

    } catch (error) {
        console.error("Group retrieval error:", error);

        return res.status(500).json({
            message: "Unable to retrieve group."
        });
    }
});


module.exports = router;