const express = require("express");

const {
    readData
} = require("../utils/fileStore");

const router = express.Router();


// GET PERMANENTLY BANNED USERS
router.get(
    "/banned-users/:userId",
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
                    message:
                        "Access denied."
                });
            }


            return res.json(
                data.bannedUsers
            );


        } catch (error) {

            console.error(
                "Banned user retrieval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve banned users."
            });
        }
    }
);


module.exports = router;