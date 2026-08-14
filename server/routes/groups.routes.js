const express = require("express");

const { readData } = require("../utils/fileStore");

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