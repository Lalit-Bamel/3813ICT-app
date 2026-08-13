const express = require("express");
const bcrypt = require("bcrypt");

const { readData, writeData } = require("../utils/fileStore");

const router = express.Router();


function getSafeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}


// GET OWN PROFILE
router.get("/:userId", function(req, res) {
    try {
        const data = readData();

        const user = data.users.find(
            currentUser => currentUser.id === req.params.userId
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.json(getSafeUser(user));

    } catch (error) {
        console.error("Profile retrieval error:", error);

        return res.status(500).json({
            message: "Unable to retrieve profile."
        });
    }
});


// UPDATE PROFILE
router.put("/:userId", async function(req, res) {
    try {
        const {
            firstName,
            lastName,
            username,
            age,
            profilePicture,
            newPassword
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !username ||
            age === undefined
        ) {
            return res.status(400).json({
                message: "Required profile fields are missing."
            });
        }

        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanUsername = username.trim();
        const numericAge = Number(age);

        if (
            !cleanFirstName ||
            !cleanLastName ||
            !cleanUsername
        ) {
            return res.status(400).json({
                message: "Profile fields cannot be empty."
            });
        }

        if (
            !Number.isInteger(numericAge) ||
            numericAge < 0
        ) {
            return res.status(400).json({
                message: "A valid age is required."
            });
        }

        const data = readData();

        const userIndex = data.users.findIndex(
            user => user.id === req.params.userId
        );

        if (userIndex === -1) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const user = data.users[userIndex];

        // Email must never be changed.
        if (
            req.body.email !== undefined &&
            req.body.email.toLowerCase() !== user.email.toLowerCase()
        ) {
            return res.status(400).json({
                message: "Email address cannot be changed."
            });
        }

        const usernameExists = data.users.some(
            existingUser =>
                existingUser.id !== user.id &&
                existingUser.username.toLowerCase() ===
                cleanUsername.toLowerCase()
        );

        if (usernameExists) {
            return res.status(409).json({
                message: "Username is already in use."
            });
        }

        user.firstName = cleanFirstName;
        user.lastName = cleanLastName;
        user.username = cleanUsername;
        user.age = numericAge;

        if (profilePicture !== undefined) {
            user.profilePicture = profilePicture;
        }

        if (newPassword) {

            if (
                newPassword.length < 8 ||
                !/[A-Z]/.test(newPassword)
            ) {
                return res.status(400).json({
                    message:
                        "Password must contain at least 8 characters and one uppercase letter."
                });
            }

            user.passwordHash =
                await bcrypt.hash(newPassword, 10);
        }

        data.users[userIndex] = user;

        writeData(data);

        return res.json({
            message: "Profile updated successfully.",
            user: getSafeUser(user)
        });

    } catch (error) {
        console.error("Profile update error:", error);

        return res.status(500).json({
            message: "Unable to update profile."
        });
    }
});


module.exports = router;