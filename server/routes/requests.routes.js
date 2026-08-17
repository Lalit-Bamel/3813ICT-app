const express = require("express");
const crypto = require("crypto");

const {
    readData,
    writeData
} = require("../utils/fileStore");

const router = express.Router();


function addRequesterUsername(request, data) {

    const requester = data.users.find(
        user => user.id === request.requesterId
    );

    return {
        ...request,
        requesterUsername:
            requester?.username || "Unknown User"
    };
}


// CREATE GROUP REQUEST
router.post("/group-creation", function(req, res) {

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
                message:
                    "All group information is required."
            });
        }


        const cleanTitle = title.trim();
        const cleanDescription = description.trim();
        const numericAge = Number(minimumAge);


        if (
            cleanTitle.length === 0 ||
            cleanTitle.length > 30
        ) {
            return res.status(400).json({
                message:
                    "Group title must contain between 1 and 30 characters."
            });
        }


        if (
            cleanDescription.length === 0 ||
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


        const requester = data.users.find(
            user => user.id === requesterId
        );


        if (!requester) {
            return res.status(404).json({
                message: "Requesting user not found."
            });
        }


        if (requester.systemRole === "superAdmin") {
            return res.status(403).json({
                message:
                    "Super Administrator cannot request groups."
            });
        }


        const duplicateRequest =
            data.requests.some(
                request =>
                    request.type === "groupCreation" &&
                    request.requesterId === requesterId &&
                    request.status === "pending" &&
                    request.details?.title
                        ?.toLowerCase() ===
                    cleanTitle.toLowerCase()
            );


        if (duplicateRequest) {
            return res.status(409).json({
                message:
                    "A pending request already exists for this group."
            });
        }


        const request = {

            id: crypto.randomUUID(),

            type: "groupCreation",

            requesterId: requesterId,

            targetGroupId: null,

            targetUserId: null,

            details: {
                title: cleanTitle,
                description: cleanDescription,
                minimumAge: numericAge,
                theme: theme
            },

            reason: null,

            status: "pending",

            rejectionReason: null,

            createdAt: new Date().toISOString()
        };


        data.requests.push(request);

        writeData(data);


        return res.status(201).json({
            message:
                "Group creation request submitted.",
            request: request
        });


    } catch (error) {

        console.error(
            "Group request error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to submit group request."
        });
    }
});



// JOIN GROUP REQUEST
router.post("/join", function(req, res) {

    try {

        const {
            requesterId,
            groupId
        } = req.body;


        if (!requesterId || !groupId) {
            return res.status(400).json({
                message:
                    "User and group are required."
            });
        }


        const data = readData();


        const user = data.users.find(
            currentUser =>
                currentUser.id === requesterId
        );


        const group = data.groups.find(
            currentGroup =>
                currentGroup.id === groupId
        );


        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }


        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }


        if (group.memberIds.includes(user.id)) {
            return res.status(409).json({
                message:
                    "You are already a member of this group."
            });
        }


        if (
            group.bannedUserIds.includes(user.id)
        ) {
            return res.status(403).json({
                message:
                    "You are banned from this group."
            });
        }


        if (user.age < group.minimumAge) {
            return res.status(403).json({
                message:
                    `You must be at least ${group.minimumAge} years old to join this group.`
            });
        }


        const pendingRequest =
            data.requests.some(
                request =>
                    request.type === "joinGroup" ||
                    request.type === "roomCreation" &&
                    request.requesterId === user.id &&
                    request.targetGroupId === group.id &&
                    request.status === "pending"
            );


        if (pendingRequest) {
            return res.status(409).json({
                message:
                    "You already have a pending request for this group."
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


        data.requests.push(request);

        writeData(data);


        return res.status(201).json({
            message:
                "Join request submitted.",
            request: request
        });


    } catch (error) {

        console.error(
            "Join request error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to submit join request."
        });
    }
});

// ROOM CREATION REQUEST
router.post("/room-creation", function(req, res) {

    try {

        const {
            requesterId,
            groupId,
            roomName
        } = req.body;


        if (
            !requesterId ||
            !groupId ||
            !roomName?.trim()
        ) {
            return res.status(400).json({
                message:
                    "User, group and room name are required."
            });
        }


        const data = readData();


        const user = data.users.find(
            currentUser =>
                currentUser.id === requesterId
        );


        const group = data.groups.find(
            currentGroup =>
                currentGroup.id === groupId
        );


        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }


        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }


        if (!group.memberIds.includes(user.id)) {
            return res.status(403).json({
                message:
                    "You must be a member of the group to propose a room."
            });
        }


        const pendingRequest =
            data.requests.some(
                request =>
                    request.type === "roomCreation" &&
                    request.requesterId === user.id &&
                    request.targetGroupId === group.id &&
                    request.status === "pending" &&
                    request.details?.roomName
                        ?.toLowerCase() ===
                    roomName.trim().toLowerCase()
            );


        if (pendingRequest) {
            return res.status(409).json({
                message:
                    "You already have a pending request for this room."
            });
        }


        const request = {

            id: crypto.randomUUID(),

            type: "roomCreation",

            requesterId: user.id,

            targetGroupId: group.id,

            targetUserId: null,

            details: {
                roomName:
                    roomName.trim()
            },

            reason: null,

            status: "pending",

            rejectionReason: null,

            createdAt:
                new Date().toISOString()
        };


        data.requests.push(request);

        writeData(data);


        return res.status(201).json({
            message:
                "Room creation request submitted.",
            request: request
        });


    } catch (error) {

        console.error(
            "Room request error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to submit room request."
        });
    }
});

// SUPER ADMIN GROUP REQUESTS
router.get(
    "/super-admin/:userId",
    function(req, res) {

        try {

            const data = readData();


            const user = data.users.find(
                currentUser =>
                    currentUser.id ===
                    req.params.userId
            );


            if (
                !user ||
                user.systemRole !== "superAdmin"
            ) {
                return res.status(403).json({
                    message: "Access denied."
                });
            }


            const requests =
                data.requests
                    .filter(
                        request =>
                            request.type ===
                                "groupCreation" &&
                            request.status ===
                                "pending"
                    )
                    .map(
                        request =>
                            addRequesterUsername(
                                request,
                                data
                            )
                    );


            return res.json(requests);


        } catch (error) {

            console.error(
                "Request retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve requests."
            });
        }
    }
);



// GROUP ADMIN JOIN REQUESTS
router.get(
    "/group-admin/:userId/:groupId",
    function(req, res) {

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


            if (
                !group.adminIds.includes(
                    req.params.userId
                )
            ) {
                return res.status(403).json({
                    message: "Access denied."
                });
            }


            const requests =
                data.requests
                    .filter(
                        request =>
                            request.type ===
                                "joinGroup" &&
                            request.targetGroupId ===
                                group.id &&
                            request.status ===
                                "pending"
                    )
                    .map(
                        request =>
                            addRequesterUsername(
                                request,
                                data
                            )
                    );


            return res.json(requests);


        } catch (error) {

            console.error(
                "Request retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve requests."
            });
        }
    }
);



// APPROVE / REJECT REQUEST
router.put("/:requestId", function(req, res) {

    try {

        const {
            actorId,
            status,
            rejectionReason
        } = req.body;


        if (
            status !== "approved" &&
            status !== "rejected"
        ) {
            return res.status(400).json({
                message:
                    "Request status must be approved or rejected."
            });
        }


        if (
            status === "rejected" &&
            !rejectionReason?.trim()
        ) {
            return res.status(400).json({
                message:
                    "A rejection reason is required."
            });
        }


        const data = readData();


        const request = data.requests.find(
            currentRequest =>
                currentRequest.id ===
                req.params.requestId
        );


        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }


        if (request.status !== "pending") {
            return res.status(409).json({
                message:
                    "This request has already been actioned."
            });
        }


        // GROUP CREATION
        if (request.type === "groupCreation") {

            const actor = data.users.find(
                user => user.id === actorId
            );


            if (
                !actor ||
                actor.systemRole !== "superAdmin"
            ) {
                return res.status(403).json({
                    message:
                        "Only the Super Administrator can action group creation requests."
                });
            }


            if (status === "approved") {

                const requester =
                    data.users.find(
                        user =>
                            user.id ===
                            request.requesterId
                    );


                if (!requester) {
                    return res.status(404).json({
                        message:
                            "Requesting user no longer exists."
                    });
                }


                const group = {

                    id: crypto.randomUUID(),

                    title:
                        request.details.title,

                    description:
                        request.details.description,

                    minimumAge:
                        request.details.minimumAge,

                    theme:
                        request.details.theme,

                    adminIds: [
                        requester.id
                    ],

                    memberIds: [
                        requester.id
                    ],

                    bannedUserIds: [],

                    roomIds: [],

                    createdAt:
                        new Date().toISOString()
                };


                data.groups.push(group);
            }
        }



        // JOIN GROUP
        if (request.type === "joinGroup") {

            const group = data.groups.find(
                currentGroup =>
                    currentGroup.id ===
                    request.targetGroupId
            );


            if (!group) {
                return res.status(404).json({
                    message: "Group not found."
                });
            }


            if (
                !group.adminIds.includes(actorId)
            ) {
                return res.status(403).json({
                    message:
                        "Only a Group Administrator can action this join request."
                });
            }


            if (status === "approved") {

                const user = data.users.find(
                    currentUser =>
                        currentUser.id ===
                        request.requesterId
                );


                if (!user) {
                    return res.status(404).json({
                        message:
                            "Requesting user no longer exists."
                    });
                }


                if (
                    user.age <
                    group.minimumAge
                ) {
                    return res.status(403).json({
                        message:
                            "User no longer meets the minimum age requirement."
                    });
                }


                if (
                    group.bannedUserIds.includes(
                        user.id
                    )
                ) {
                    return res.status(403).json({
                        message:
                            "User is banned from this group."
                    });
                }


                if (
                    !group.memberIds.includes(
                        user.id
                    )
                ) {
                    group.memberIds.push(
                        user.id
                    );
                }
            }
        }
        // ROOM CREATION
        if (request.type === "roomCreation") {
        
            const group = data.groups.find(
                currentGroup =>
                    currentGroup.id ===
                    request.targetGroupId
            );
        
        
            if (!group) {
                return res.status(404).json({
                    message: "Group not found."
                });
            }
        
        
            if (!group.adminIds.includes(actorId)) {
                return res.status(403).json({
                    message:
                        "Only a Group Administrator can action this room request."
                });
            }
        
        
            if (status === "approved") {
            
                const room = {
                
                    id: crypto.randomUUID(),
                
                    groupId: group.id,
                
                    name:
                        request.details.roomName,
                
                    createdAt:
                        new Date().toISOString()
                };
            
            
                data.rooms.push(room);
            
                group.roomIds.push(room.id);
            }
        }

        request.status = status;

        request.rejectionReason =
            status === "rejected"
                ? rejectionReason.trim()
                : null;


        writeData(data);


        return res.json({
            message:
                `Request ${status} successfully.`,
            request: request
        });


    } catch (error) {

        console.error(
            "Request action error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to action request."
        });
    }
});


module.exports = router;