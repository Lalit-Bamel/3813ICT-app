const express = require("express");
const bcrypt = require("bcrypt");

const { getDb } = require("../db/mongo");

const router = express.Router();

/**
 * Removes sensitive and database-only fields before returning a user.
 */
function getSafeUser(user) {

    const {
        passwordHash,
        _id,
        ...safeUser
    } = user;

    return safeUser;
}

/**
 * Escapes special RegExp characters in user input.
 */
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


// ==================================================
// GET OWN PROFILE
// ==================================================

router.get("/:userId", async function (req, res) {

    try {

        const db =
            getDb();

        const usersCollection =
            db.collection("users");

        const user =
            await usersCollection.findOne({
                id: req.params.userId
            });

        if (!user) {
            return res.status(404).json({
                message:
                    "User not found."
            });
        }

        return res.json(
            getSafeUser(user)
        );

    } catch (error) {

        console.error(
            "Profile retrieval error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to retrieve profile."
        });
    }
});


// ==================================================
// UPDATE PROFILE
// ==================================================

router.put("/:userId", async function (req, res) {

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
                message:
                    "Required profile fields are missing."
            });
        }

        const cleanFirstName =
            firstName.trim();

        const cleanLastName =
            lastName.trim();

        const cleanUsername =
            username.trim();

        const numericAge =
            Number(age);

        if (
            !cleanFirstName ||
            !cleanLastName ||
            !cleanUsername
        ) {
            return res.status(400).json({
                message:
                    "Profile fields cannot be empty."
            });
        }

        if (
            !Number.isInteger(numericAge) ||
            numericAge < 0
        ) {
            return res.status(400).json({
                message:
                    "A valid age is required."
            });
        }

        const db =
            getDb();

        const usersCollection =
            db.collection("users");

        const user =
            await usersCollection.findOne({
                id: req.params.userId
            });

        if (!user) {
            return res.status(404).json({
                message:
                    "User not found."
            });
        }

        // Email cannot be changed.
        if (
            req.body.email !== undefined &&
            req.body.email.toLowerCase() !==
                user.email.toLowerCase()
        ) {
            return res.status(400).json({
                message:
                    "Email address cannot be changed."
            });
        }

        const usernameExists =
            await usersCollection.findOne({
                id: {
                    $ne: user.id
                },
                username: {
                    $regex:
                        `^${escapeRegex(cleanUsername)}$`,
                    $options: "i"
                }
            });

        if (usernameExists) {
            return res.status(409).json({
                message:
                    "Username is already in use."
            });
        }

        const updateFields = {
            firstName:
                cleanFirstName,
            lastName:
                cleanLastName,
            username:
                cleanUsername,
            age:
                numericAge
        };

        if (profilePicture !== undefined) {
            updateFields.profilePicture =
                profilePicture;
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

            updateFields.passwordHash =
                await bcrypt.hash(
                    newPassword,
                    10
                );
        }

        await usersCollection.updateOne(
            {
                id: user.id
            },
            {
                $set:
                    updateFields
            }
        );

        const updatedUser = {
            ...user,
            ...updateFields
        };

        return res.json({
            message:
                "Profile updated successfully.",
            user:
                getSafeUser(updatedUser)
        });

    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to update profile."
        });
    }
});

module.exports = router;