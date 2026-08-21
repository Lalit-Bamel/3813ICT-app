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

// GET GROUP MEMBERS
router.get("/:groupId/members", function(req, res) {

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

        const members = data.users
            .filter(
                user =>
                    group.memberIds.includes(user.id)
            )
            .map(user => ({
                id: user.id,
                username: user.username
            }));

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
});



// GROUP ADMIN RESIGNS
router.post(
    "/:groupId/admins/resign",
    function(req, res) {

        try {

            const actorId =
                req.body.actorId;


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
                !group.adminIds.includes(actorId)
            ) {
                return res.status(403).json({
                    message:
                        "You are not a Group Administrator."
                });
            }


            if (group.adminIds.length <= 1) {

                return res.status(409).json({
                    message:
                        "You cannot resign because the group must always have at least one administrator."
                });
            }


            group.adminIds =
                group.adminIds.filter(
                    adminId =>
                        adminId !== actorId
                );


            writeData(data);


            return res.json({
                message:
                    "You have resigned as Group Administrator.",
                group: group
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

// PROMOTE MEMBER TO GROUP ADMIN
router.post(
    "/:groupId/admins/:userId",
    function(req, res) {

        try {

            const actorId =
                req.body.actorId;


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
                !group.adminIds.includes(actorId)
            ) {
                return res.status(403).json({
                    message:
                        "Only a Group Administrator can promote members."
                });
            }


            const targetUserId =
                req.params.userId;


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


            group.adminIds.push(
                targetUserId
            );


            writeData(data);


            return res.json({
                message:
                    "Member promoted to Group Administrator.",
                group: group
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



// DEMOTE GROUP ADMIN
router.delete(
    "/:groupId/admins/:userId",
    function(req, res) {

        try {

            const actorId =
                req.body.actorId;


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
                !group.adminIds.includes(actorId)
            ) {
                return res.status(403).json({
                    message:
                        "Only a Group Administrator can demote administrators."
                });
            }


            const targetUserId =
                req.params.userId;


            if (targetUserId === actorId) {

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


            if (group.adminIds.length <= 1) {

                return res.status(409).json({
                    message:
                        "A group must always have at least one administrator."
                });
            }


            group.adminIds =
                group.adminIds.filter(
                    adminId =>
                        adminId !== targetUserId
                );


            writeData(data);


            return res.json({
                message:
                    "Group Administrator demoted successfully.",
                group: group
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

// EDIT GROUP
router.put("/:groupId", function(req, res) {

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


        const cleanTitle = title.trim();

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
                    "Only a Group Administrator can edit this group."
            });
        }


        // Work out who still meets the new age rule.
        const eligibleMemberIds =
            group.memberIds.filter(memberId => {

                const user = data.users.find(
                    currentUser =>
                        currentUser.id === memberId
                );

                return (
                    user &&
                    user.age >= numericAge
                );
            });


        const eligibleAdminIds =
            group.adminIds.filter(adminId =>
                eligibleMemberIds.includes(adminId)
            );


        // A group must always have at least one admin.
        if (eligibleAdminIds.length === 0) {

            return res.status(409).json({
                message:
                    "Minimum age cannot be changed because it would remove every Group Administrator."
            });
        }


        group.title =
            cleanTitle;

        group.description =
            cleanDescription;

        group.minimumAge =
            numericAge;

        group.theme =
            theme;


        group.memberIds =
            eligibleMemberIds;

        group.adminIds =
            eligibleAdminIds;


        writeData(data);


        return res.json({
            message:
                "Group updated successfully.",
            group: group
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